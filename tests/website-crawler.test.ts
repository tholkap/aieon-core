import assert from "node:assert/strict";
import test from "node:test";

import { WebsiteCrawler, configuredPageLimit } from "../src/core/discovery/WebsiteCrawler";
import { WebsiteFetcher, type WebsiteResource } from "../src/core/discovery/WebsiteFetcher";

class FixtureFetcher extends WebsiteFetcher {
  readonly requested: string[] = [];

  constructor(private readonly pages: Record<string, { body: string; contentType?: string }>) { super(); }

  override async fetchPage(input: string) {
    const resource = await this.read(input);
    return { html: resource.body, finalUrl: resource.finalUrl };
  }

  override async fetchResource(input: string, _allowed: readonly string[]): Promise<WebsiteResource> {
    return this.read(input);
  }

  private async read(input: string): Promise<WebsiteResource> {
    const url = new URL(input).href;
    this.requested.push(url);
    const fixture = this.pages[url];
    if (!fixture) throw new Error("not found");
    return { body: fixture.body, finalUrl: url, contentType: fixture.contentType ?? "text/html" };
  }
}

test("discovers same-origin HTML links and sitemap pages while preserving page provenance", async () => {
  const fetcher = new FixtureFetcher({
    "https://example.com/": { body: '<link rel="sitemap" href="/catalog.xml"><h1>Home</h1><a href="/about?campaign=x#team">About</a><a href="https://other.example/no">Off site</a>' },
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
