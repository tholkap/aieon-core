import { load } from "cheerio";

import { HtmlParser } from "@/src/core/discovery/HtmlParser";
import { WebsiteFetcher } from "@/src/core/discovery/WebsiteFetcher";
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
  ) {
    if (!Number.isInteger(pageLimit) || pageLimit < 1 || pageLimit > DEVELOPMENT_MAX_PAGES) {
      throw new Error(`Crawl page limit must be between 1 and ${DEVELOPMENT_MAX_PAGES}.`);
    }
  }

  async crawl(input: string): Promise<WebsiteCrawlResult> {
    const first = await this.fetcher.fetchPage(input);
    const root = new URL(first.finalUrl);
    const siteOrigin = root.origin;
    const queue = [root.href];
    let discoveryTruncated = false;
    let duplicatePages = 0;
    const finalUrls = new Set<string>();
    const discovered = new Set(queue);
    const enqueue = (url: string) => {
      if (discovered.has(url)) return;
      if (discovered.size >= MAX_DISCOVERED_URLS) { discoveryTruncated = true; return; }
      discovered.add(url); queue.push(url);
    };
    // Navigation must not be displaced by arbitrary sitemap ordering.
    for (const link of pageLinks(first.html, root.href, siteOrigin)) enqueue(link);
    const attempted = new Set<string>();
    const scannedUrls: string[] = [];
    const failedUrls: string[] = [];
    const observations: Observation[] = [];
    const sitemapUrls = new Set([new URL("/sitemap.xml", root).href, ...declaredSitemaps(first.html, root.href, siteOrigin)]);
    const initialPages = new Map([[root.href, first.html]]);

    const checkedSitemaps: string[] = [];
    for (const sitemapUrl of sitemapUrls) {
      if (checkedSitemaps.length >= MAX_SITEMAPS) { discoveryTruncated = true; break; }
      checkedSitemaps.push(sitemapUrl);
      try {
        const resource = await this.fetcher.fetchResource(sitemapUrl, ["application/xml", "text/xml", "application/rss+xml"]);
        for (const location of sitemapLocations(resource.body, resource.finalUrl, siteOrigin)) {
          if (/\.xml$/i.test(new URL(location).pathname)) {
            if (sitemapUrls.size < MAX_SITEMAPS) sitemapUrls.add(location);
            else if (!sitemapUrls.has(location)) discoveryTruncated = true;
          } else enqueue(location);
        }
      } catch { /* Sitemap discovery is optional; page failures are reported separately. */ }
    }

    while (queue.length && attempted.size < this.pageLimit) {
      const requestedUrl = queue.shift()!;
      attempted.add(requestedUrl);
      try {
        const stored = initialPages.get(requestedUrl);
        const page = stored === undefined ? await this.fetcher.fetchPage(requestedUrl) : { html: stored, finalUrl: requestedUrl };
        if (new URL(page.finalUrl).origin !== siteOrigin) throw new Error("cross-origin redirect");
        if (finalUrls.has(page.finalUrl)) { duplicatePages++; continue; }
        finalUrls.add(page.finalUrl);
        scannedUrls.push(page.finalUrl);
        observations.push(...this.parser.parse(page.html, page.finalUrl));
        for (const link of pageLinks(page.html, page.finalUrl, siteOrigin)) {
          enqueue(link);
        }
      } catch { failedUrls.push(requestedUrl); }
    }

    return { observations, coverage: {
      pageLimit: this.pageLimit, pagesDiscovered: discovered.size, pagesAttempted: attempted.size,
      pagesScanned: scannedUrls.length, pagesFailed: failedUrls.length,
      pagesSkipped: Math.max(0, discovered.size - attempted.size),
      limitReached: queue.length > 0 && attempted.size >= this.pageLimit,
      scannedUrls, failedUrls, sitemapUrls: checkedSitemaps, discoveryTruncated, duplicatePages,
    } };
  }
}
