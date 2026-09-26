import robotsParser from "robots-parser";
import { setTimeout as delay } from "node:timers/promises";
import { WebsiteFetcher, WebsiteHttpError, type FetchControl } from "./WebsiteFetcher";
import { WebsiteFetchError } from "./PublicWebsitePolicy";

export class RobotsDeniedError extends WebsiteFetchError {}

/** Per-scan robots cache; network errors fail closed, while 404/410 mean absent. */
export class CrawlRobotsPolicy {
  private readonly policies = new Map<string, ReturnType<typeof robotsParser>>();
  private readonly lastRequest = new Map<string, number>();
  readonly sitemapUrls = new Set<string>();
  constructor(private readonly fetcher: WebsiteFetcher, private readonly control: FetchControl) {}

  async check(url: URL): Promise<void> {
    let policy = this.policies.get(url.origin);
    if (!policy) {
      if (this.policies.size >= 4) throw new RobotsDeniedError("Too many website origins to check crawl permissions.");
      const robotsUrl = new URL("/robots.txt", url).href;
      let body = "";
      try {
        const resource = await this.fetcher.fetchResource(robotsUrl, ["text/plain"], this.control);
        if (Buffer.byteLength(resource.body) > 512 * 1024) throw new Error("Robots file too large");
        body = resource.body;
      } catch (error) {
        if (!(error instanceof WebsiteHttpError && [404, 410].includes(error.status))) {
          throw new RobotsDeniedError("AiEON could not verify this website's crawl permissions. Please try again later.");
        }
      }
      policy = robotsParser(robotsUrl, body);
      this.policies.set(url.origin, policy);
      for (const sitemap of policy.getSitemaps()) {
        if (this.sitemapUrls.size >= 10) break;
        this.sitemapUrls.add(sitemap);
      }
    }
    if (policy.isAllowed(url.href, "AiEON") !== true) {
      throw new RobotsDeniedError("This page is excluded by the website's crawl rules.");
    }
    const seconds = policy.getCrawlDelay("AiEON") ?? 0;
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > 60) throw new RobotsDeniedError("The website requests a crawl delay beyond this scan's time budget.");
    const wait = Math.max(0, (this.lastRequest.get(url.origin) ?? 0) + seconds * 1000 - Date.now());
    if (wait) await delay(wait, undefined, {signal: this.control.signal});
    this.lastRequest.set(url.origin, Date.now());
  }
}
