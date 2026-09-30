import { CrawlRobotsPolicy, RobotsDeniedError } from "./CrawlRobotsPolicy";
import { load } from "cheerio";
import { linkHints, selectNextPage, type PageKind } from "./PageSelection";

import { HtmlParser } from "@/src/core/discovery/HtmlParser";
import { WebsiteFetchError } from "./PublicWebsitePolicy";
import { WebsiteFetcher, type FetchControl } from "@/src/core/discovery/WebsiteFetcher";
import type { Observation } from "@/src/types/observation";

export const DEVELOPMENT_MAX_PAGES = 25;
const MAX_SITEMAPS = 10;
const MAX_DISCOVERED_URLS = 2000;

export function configuredPageLimit(value = process.env.AIEON_CRAWL_PAGE_LIMIT): number {
  if (value === undefined || value === "") return DEVELOPMENT_MAX_PAGES;
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > DEVELOPMENT_MAX_PAGES) {
    throw new Error(`AIEON_CRAWL_PAGE_LIMIT must be an integer from 1 to ${DEVELOPMENT_MAX_PAGES}.`);
  }
  return limit;
}

export interface CrawlCoverage {
  pageLimit: number;
  pagesDiscovered: number;
  pagesAttempted: number;
  pagesScanned: number;
  pagesFailed: number;
  pagesSkipped: number;
  limitReached: boolean;
  scannedUrls: string[];
  failedUrls: string[];
  sitemapUrls: string[];
  discoveryTruncated: boolean;
  duplicatePages: number;
  robotsExcludedUrls: string[];
  stoppedReason?: "deadline" | "bytes" | "requests" | "observations";
}

export interface WebsiteCrawlResult { observations: Observation[]; coverage: CrawlCoverage }

function normalizedInternalUrl(raw: string, base: URL, siteOrigin: string): string | undefined {
  try {
    const url = new URL(raw, base);
    if (url.origin !== siteOrigin || !["http:", "https:"].includes(url.protocol)) return;
    if (/\.(?:avif|css|csv|docx?|gif|ico|jpe?g|js|json|mp3|mp4|pdf|png|svg|webp|xlsx?|zip)$/i.test(url.pathname)) return;
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(?:utm_.+|gclid|fbclid|msclkid)$/i.test(key)) url.searchParams.delete(key);
    }
    return url.href;
  } catch { return; }
}

function pageLinks(html: string, pageUrl: string, siteOrigin: string): string[] {
  const $ = load(html);
  const base = new URL(pageUrl);
  const links: string[] = [];
  $("a[href]").each((_index, element) => {
    const href = $(element).attr("href");
    if (href) links.push(normalizedInternalUrl(href, base, siteOrigin) ?? "");
  });
  return links.filter(Boolean);
}

function declaredSitemaps(html: string, pageUrl: string, siteOrigin: string): string[] {
  const $ = load(html);
  const base = new URL(pageUrl);
  return $('link[rel~="sitemap"][href]').map((_index, element) =>
    normalizedInternalUrl($(element).attr("href") ?? "", base, siteOrigin) ?? "",
  ).get().filter(Boolean);
}

function sitemapLocations(xml: string, sitemapUrl: string, siteOrigin: string): string[] {
  const $ = load(xml, { xmlMode: true });
  const base = new URL(sitemapUrl);
  return $("loc").map((_index, element) =>
    normalizedInternalUrl($(element).text().trim(), base, siteOrigin) ?? "",
  ).get().filter(Boolean);
}

/** Bounded breadth-first collector. Raising/removing the cap is an operational choice, not an architecture rewrite. */
export class WebsiteCrawler {
  constructor(
    private readonly fetcher = new WebsiteFetcher(),
    private readonly parser = new HtmlParser(),
    private readonly pageLimit = configuredPageLimit(),
    private readonly scanTimeoutMs = 60_000,
  ) {
    if (!Number.isInteger(scanTimeoutMs) || scanTimeoutMs < 1 || scanTimeoutMs > 60_000) throw new Error("Invalid scan deadline.");
    if (!Number.isInteger(pageLimit) || pageLimit < 1 || pageLimit > DEVELOPMENT_MAX_PAGES) {
      throw new Error(`Crawl page limit must be between 1 and ${DEVELOPMENT_MAX_PAGES}.`);
    }
  }

  async crawl(input: string): Promise<WebsiteCrawlResult> {
    const controller = new AbortController();
    let stoppedReason: CrawlCoverage["stoppedReason"];
    const stop = (reason: NonNullable<CrawlCoverage["stoppedReason"]>) => {
      stoppedReason ??= reason;
      controller.abort();
      throw new WebsiteFetchError("The scan reached its resource limit.");
    };
    const expiresAt = Date.now() + this.scanTimeoutMs;
    const timer = setTimeout(() => { stoppedReason = "deadline"; controller.abort(); }, this.scanTimeoutMs);
    let bytes = 0;
    let requests = 0;
    let scope: string | undefined;
    const control: FetchControl = {
      signal: controller.signal,
      beforeRequest: (url) => {
        if (Date.now() >= expiresAt) stop("deadline");
        if (scope && url.origin !== scope) throw new WebsiteFetchError("Redirect leaves the scanned website.");
        if (++requests > 50) stop("requests");
      },
      onBytes: (count) => { bytes += count; if (bytes > 20 * 1024 * 1024) stop("bytes"); },
    };
    const robots = new CrawlRobotsPolicy(this.fetcher, control);
    const contentControl: FetchControl = {...control, beforeRequest: async (url) => {
      await control.beforeRequest?.(url);
      await robots.check(url);
    }};
    try {
    const first = await this.fetcher.fetchPage(input, contentControl);
    const root = new URL(first.finalUrl);
    const siteOrigin = root.origin;
    scope = siteOrigin;
    const queue: string[] = [];
    const hints = linkHints(first.html, root.href);
    const selectedCounts: Record<PageKind, number> = {policy: 0, product: 0, category: 0, content: 0, utility: 0};
    let discoveryTruncated = false;
    let duplicatePages = 0;
    const finalUrls = new Set<string>([root.href]);
    const discovered = new Set([root.href]);
    const enqueue = (url: string) => {
      if (discovered.has(url)) return;
      if (discovered.size >= MAX_DISCOVERED_URLS) { discoveryTruncated = true; return; }
      discovered.add(url); queue.push(url);
    };
    // Navigation must not be displaced by arbitrary sitemap ordering.
    for (const link of pageLinks(first.html, root.href, siteOrigin)) enqueue(link);
    const attempted = new Set<string>([root.href]);
    const scannedUrls: string[] = [root.href];
    const failedUrls: string[] = [];
    const robotsExcludedUrls: string[] = [];
    const rootObservations = this.parser.parse(first.html, root.href);
    const observations: Observation[] = rootObservations.slice(0, 10_000);
    if (rootObservations.length > observations.length) { stoppedReason = "observations"; controller.abort(); }
    const sitemapUrls = new Set([new URL("/sitemap.xml", root).href, ...declaredSitemaps(first.html, root.href, siteOrigin), ...[...robots.sitemapUrls].map(url => normalizedInternalUrl(url, root, siteOrigin)).filter((url): url is string => !!url)]);

    const checkedSitemaps: string[] = [];
    // Read discovered HTML first. Sitemaps supplement exhausted link discovery,
    // rather than consuming the deadline before any useful content is read.
    while (attempted.size < this.pageLimit) {
      if (controller.signal.aborted || Date.now() >= expiresAt) { stoppedReason ??= "deadline"; break; }
      if (!queue.length) {
        const sitemapUrl = [...sitemapUrls].find(url => !checkedSitemaps.includes(url));
        if (!sitemapUrl) break;
        if (checkedSitemaps.length >= MAX_SITEMAPS) { discoveryTruncated = true; break; }
        checkedSitemaps.push(sitemapUrl);
        try {
          const resource = await this.fetcher.fetchResource(sitemapUrl, ["application/xml", "text/xml", "application/rss+xml"], contentControl);
          for (const location of sitemapLocations(resource.body, resource.finalUrl, siteOrigin)) {
            if (/\.xml$/i.test(new URL(location).pathname)) {
              if (sitemapUrls.size < MAX_SITEMAPS) sitemapUrls.add(location);
              else if (!sitemapUrls.has(location)) discoveryTruncated = true;
            } else enqueue(location);
          }
        } catch { /* Optional discovery failure does not invalidate collected pages. */ }
        continue;
      }
      const requestedUrl = selectNextPage(queue, hints, selectedCounts);
      attempted.add(requestedUrl);
      try {
        const page = await this.fetcher.fetchPage(requestedUrl, contentControl);
        if (new URL(page.finalUrl).origin !== siteOrigin) throw new Error("cross-origin redirect");
        if (finalUrls.has(page.finalUrl)) { duplicatePages++; continue; }
        finalUrls.add(page.finalUrl);
        scannedUrls.push(page.finalUrl);
        const pageObservations = this.parser.parse(page.html, page.finalUrl);
        const remaining = 10_000 - observations.length;
        observations.push(...pageObservations.slice(0, remaining));
        if (pageObservations.length > remaining) {
          stoppedReason = "observations";
          controller.abort();
          break;
        }
        for (const [link, kind] of linkHints(page.html, page.finalUrl)) {
          if (!hints.has(link)) hints.set(link, kind);
        }
        for (const link of pageLinks(page.html, page.finalUrl, siteOrigin)) {
          enqueue(link);
        }
      } catch (error) {
        if (error instanceof RobotsDeniedError) robotsExcludedUrls.push(requestedUrl);
        else if (!scannedUrls.includes(requestedUrl)) failedUrls.push(requestedUrl);
      }
    }

    return { observations, coverage: {
      pageLimit: this.pageLimit, pagesDiscovered: discovered.size, pagesAttempted: attempted.size,
      pagesScanned: scannedUrls.length, pagesFailed: failedUrls.length,
      pagesSkipped: Math.max(0, discovered.size - attempted.size),
      limitReached: queue.length > 0 && attempted.size >= this.pageLimit,
      scannedUrls, failedUrls, sitemapUrls: checkedSitemaps, discoveryTruncated: discoveryTruncated || !!stoppedReason || checkedSitemaps.length < sitemapUrls.size, duplicatePages, robotsExcludedUrls,
      ...(stoppedReason ? {stoppedReason} : {}),
    } };
    } finally { clearTimeout(timer); }
  }
}
