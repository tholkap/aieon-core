import assert from "node:assert/strict";
import test from "node:test";

import { WebsiteCrawler, configuredPageLimit } from "../src/core/discovery/WebsiteCrawler";
import { WebsiteFetcher, type FetchControl, type WebsiteResource } from "../src/core/discovery/WebsiteFetcher";

class FixtureFetcher extends WebsiteFetcher {
  readonly requested: string[] = [];

  constructor(private readonly pages: Record<string, { body: string; contentType?: string }>) { super(); }

  override async fetchPage(input: string, control: FetchControl = {}) {
    const resource = await this.read(input, control);
    return { html: resource.body, finalUrl: resource.finalUrl };
  }

  override async fetchResource(input: string, _allowed: readonly string[], control: FetchControl = {}): Promise<WebsiteResource> {
    return this.read(input, control);
  }

  private async read(input: string, control: FetchControl): Promise<WebsiteResource> {
    const url = new URL(input).href;
    await control.beforeRequest?.(new URL(url));
    this.requested.push(url);
    if (url.endsWith("/robots.txt") && !this.pages[url]) return {body: "", finalUrl: url, contentType: "text/plain"};
    const fixture = this.pages[url];
    if (!fixture) throw new Error("not found");
    return { body: fixture.body, finalUrl: url, contentType: fixture.contentType ?? "text/html" };
  }
}

test("discovers same-origin HTML links and sitemap pages while preserving page provenance", async () => {
  const fetcher = new FixtureFetcher({
    "https://example.com/": { body: '<link rel="sitemap" href="/catalog.xml"><h1>Home</h1><a href="/about?utm_campaign=x#team">About</a><a href="https://other.example/no">Off site</a>' },
    "https://example.com/sitemap.xml": { body: "<urlset><url><loc>https://example.com/services</loc></url></urlset>", contentType: "application/xml" },
    "https://example.com/catalog.xml": { body: "<urlset><url><loc>https://example.com/contact</loc></url></urlset>", contentType: "application/xml" },
    "https://example.com/services": { body: "<h1>Services</h1><p>We provide bookkeeping for small businesses.</p>" },
    "https://example.com/contact": { body: "<h1>Contact</h1>" },
    "https://example.com/about": { body: "<h1>About</h1>" },
  });

  const result = await new WebsiteCrawler(fetcher, undefined, 10).crawl("https://example.com/");

  assert.equal(result.coverage.pagesScanned, 4);
  assert.equal(result.coverage.pagesDiscovered, 4);
  assert.equal(result.coverage.limitReached, false);
  assert.deepEqual(result.coverage.sitemapUrls, ["https://example.com/sitemap.xml", "https://example.com/catalog.xml"]);
  assert.ok(result.observations.some((item) => item.pageUrl === "https://example.com/services" && item.rawValue.includes("bookkeeping")));
  assert.ok(!fetcher.requested.some((url) => url.includes("other.example")));
});

test("reports explicit coverage when the configured page bound leaves discoveries unscanned", async () => {
  const fetcher = new FixtureFetcher({
    "https://example.com/": { body: '<h1>Home</h1><a href="/a">A</a><a href="/b">B</a>' },
    "https://example.com/a": { body: "<h1>A</h1>" },
  });
  const result = await new WebsiteCrawler(fetcher, undefined, 2).crawl("https://example.com/");
  assert.deepEqual(result.coverage, {
    discoveryTruncated: false, duplicatePages: 0, robotsExcludedUrls: [],
    pageLimit: 2, pagesDiscovered: 3, pagesAttempted: 2, pagesScanned: 2, pagesFailed: 0,
    pagesSkipped: 1, limitReached: true,
    scannedUrls: ["https://example.com/", "https://example.com/a"], failedUrls: [],
    sitemapUrls: ["https://example.com/sitemap.xml"],
  });
});

test("validates the development page-limit configuration", () => {
  assert.equal(configuredPageLimit(undefined), 25);
  assert.equal(configuredPageLimit("7"), 7);
  for (const invalid of ["0", "26", "1.5", "many"]) assert.throws(() => configuredPageLimit(invalid));
});


test("caps chained sitemaps and prioritizes homepage links over sitemap entries", async () => {
  const pages: Record<string, {body: string; contentType?: string}> = {
    "https://example.com/": {body: '<a href="/about">About</a>'},
    "https://example.com/about": {body: '<h1>About</h1>'},
  };
  for (let i = 0; i < 20; i++) {
    pages[`https://example.com/${i === 0 ? "sitemap" : i}.xml`] = {
      body: `<sitemapindex><sitemap><loc>https://example.com/${i + 1}.xml</loc></sitemap><url><loc>https://example.com/product${i}</loc></url></sitemapindex>`, contentType: "application/xml",
    };
  }
  const fetcher = new FixtureFetcher(pages);
  const result = await new WebsiteCrawler(fetcher, undefined, 2).crawl("https://example.com/");
  assert.equal(result.coverage.sitemapUrls.length, 10);
  assert.equal(result.coverage.discoveryTruncated, true);
  assert.deepEqual(result.coverage.scannedUrls, ["https://example.com/", "https://example.com/about"]);
  assert.equal(fetcher.requested.length, 13);
});

test("preserves content query parameters and removes only known tracking parameters", async () => {
  const fetcher = new FixtureFetcher({
    "https://example.com/": {body: '<a href="/product?id=1&utm_source=test">One</a><a href="/product?id=2">Two</a>'},
    "https://example.com/product?id=1": {body: '<h1>One</h1>'},
    "https://example.com/product?id=2": {body: '<h1>Two</h1>'},
  });
  const result = await new WebsiteCrawler(fetcher, undefined, 3).crawl("https://example.com/");
  assert.equal(result.coverage.pagesScanned, 3);
  assert.ok(result.observations.some(o => o.pageUrl.endsWith("id=2") && o.rawValue === "Two"));
});

test("redirect aliases contribute evidence and scanned counts only once", async () => {
  class RedirectFetcher extends FixtureFetcher {
    override async fetchPage(input: string, control: FetchControl = {}) {
      const page = await super.fetchPage(input, control);
      return {...page, finalUrl: input.endsWith("/alias") ? "https://example.com/about" : page.finalUrl};
    }
  }
  const fetcher = new RedirectFetcher({
    "https://example.com/": {body: '<a href="/alias">Alias</a><a href="/about">About</a>'},
    "https://example.com/alias": {body: '<h1>About</h1>'},
    "https://example.com/about": {body: '<h1>About</h1>'},
  });
  const result = await new WebsiteCrawler(fetcher, undefined, 3).crawl("https://example.com/");
  assert.equal(result.coverage.pagesScanned, 2);
  assert.equal(result.coverage.duplicatePages, 1);
  assert.equal(new Set(result.observations.map(o => o.id)).size, result.observations.length);
});

test("robots restrictions prevent fetching content and permitted exceptions remain scannable", async () => {
  const fetcher = new FixtureFetcher({
    "https://example.com/robots.txt": {body: 'User-agent: *\nDisallow: /private\nAllow: /private/public$', contentType: 'text/plain'},
    "https://example.com/": {body: '<a href="/private">Private</a><a href="/private/public">Public</a>'},
    "https://example.com/private/public": {body: '<h1>Public</h1>'},
  });
  const result = await new WebsiteCrawler(fetcher, undefined, 3).crawl("https://example.com/");
  assert.deepEqual(result.coverage.robotsExcludedUrls, ["https://example.com/private"]);
  assert.ok(!fetcher.requested.includes("https://example.com/private"));
  assert.equal(result.coverage.pagesScanned, 2);
});

test("deadline aborts in-flight sitemap work and reports partial coverage", async () => {
  class SlowFetcher extends FixtureFetcher {
    override async fetchResource(input: string, allowed: readonly string[], control: FetchControl = {}) {
      if (input.endsWith("sitemap.xml")) {
        await new Promise<void>((_resolve, reject) => {
          if (control.signal?.aborted) { reject(new Error('aborted')); return; }
          control.signal?.addEventListener('abort', () => reject(new Error('aborted')), {once: true});
        });
      }
      return super.fetchResource(input, allowed, control);
    }
  }
  const fetcher = new SlowFetcher({"https://example.com/": {body: '<h1>Home</h1>'}});
  const result = await new WebsiteCrawler(fetcher, undefined, 3, 20).crawl("https://example.com/");
  assert.equal(result.coverage.stoppedReason, 'deadline');
  assert.equal(result.coverage.discoveryTruncated, true);
});
