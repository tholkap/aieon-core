import http, { type IncomingMessage, type RequestOptions } from "node:http";
import https from "node:https";
import { AddressResolver, parsePublicWebsiteUrl, resolveAddresses, resolvePublicAddress, WebsiteFetchError } from "./PublicWebsitePolicy";

export interface WebsiteFetcherOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
}
export interface WebsitePage { html: string; finalUrl: string }
const REDIRECTS = new Set([301, 302, 303, 307, 308]);

/** Node-only transport. No ambient proxy, cookies, authentication, or automatic redirects. */
export class WebsiteFetcher {
  private readonly timeoutMs: number;
  private readonly maxBytes: number;
  private readonly maxRedirects: number;
  constructor(options: WebsiteFetcherOptions = {}, private readonly resolver: AddressResolver = resolveAddresses) {
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.maxBytes = options.maxBytes ?? 5 * 1024 * 1024;
    this.maxRedirects = options.maxRedirects ?? 5;
    if (!Number.isInteger(this.timeoutMs) || this.timeoutMs < 1 || this.timeoutMs > 60_000 ||
        !Number.isInteger(this.maxBytes) || this.maxBytes < 1 || this.maxBytes > 10 * 1024 * 1024 ||
        !Number.isInteger(this.maxRedirects) || this.maxRedirects < 0 || this.maxRedirects > 10) {
      throw new Error("Invalid website collector limits.");
    }
  }

  async fetchHtml(input: string): Promise<string> { return (await this.fetchPage(input)).html; }

  async fetchPage(input: string): Promise<WebsitePage> {
    let url = parsePublicWebsiteUrl(input);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const seen = new Set<string>();
    try {
      for (let redirects = 0; ; redirects++) {
        if (seen.has(url.href)) throw new WebsiteFetchError("The website has a redirect loop.");
        seen.add(url.href);
        const address = await resolvePublicAddress(url.hostname, controller.signal, this.resolver);
        const response = await this.request(url, address, controller.signal);
        try {
          if (REDIRECTS.has(response.statusCode ?? 0)) {
            if (redirects >= this.maxRedirects) throw new WebsiteFetchError("The website redirects too many times.");
            const location = response.headers.location;
            if (!location) throw new WebsiteFetchError("The website returned an incomplete redirect.");
            let target: URL;
            try { target = new URL(location, url); }
            catch { throw new WebsiteFetchError("The website returned an invalid redirect."); }
            const next = parsePublicWebsiteUrl(target.href);
            if (url.protocol === "https:" && next.protocol !== "https:") throw new WebsiteFetchError("The website redirects to an insecure connection.");
            url = next;
            continue;
          }
          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
            throw new WebsiteFetchError(`The website returned HTTP ${response.statusCode ?? "error"}.`);
          }
          const mime = response.headers["content-type"]?.split(";", 1)[0].trim().toLowerCase();
          if (mime !== "text/html" && mime !== "application/xhtml+xml") throw new WebsiteFetchError("The website did not return an HTML page.");
          // Request uncompressed data; reject servers that ignore that request, avoiding decompression bombs.
          const encoding = response.headers["content-encoding"]?.toLowerCase();
          if (encoding && encoding !== "identity") throw new WebsiteFetchError("The website returned an unsupported content encoding.");
          if (Number(response.headers["content-length"] ?? 0) > this.maxBytes) throw new WebsiteFetchError("The page exceeds the scan size limit.");
          let size = 0;
          const chunks: Buffer[] = [];
          for await (const chunk of response) {
            controller.signal.throwIfAborted();
            const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            size += bytes.length;
            if (size > this.maxBytes) throw new WebsiteFetchError("The page exceeds the scan size limit.");
            chunks.push(bytes);
          }
          return {html: Buffer.concat(chunks).toString("utf8"), finalUrl: url.href};
        } finally { response.destroy(); }
      }
    } catch (error) {
      if (controller.signal.aborted) throw new WebsiteFetchError("The website took too long to respond. Please try again.");
      if (error instanceof WebsiteFetchError) throw error;
      throw new WebsiteFetchError("The website could not be reached securely. Please check the URL and try again.");
    } finally { clearTimeout(timer); }
  }

  private request(url: URL, address: {address: string; family: number}, signal: AbortSignal): Promise<IncomingMessage> {
    return new Promise((resolve, reject) => {
      const transport = url.protocol === "https:" ? https : http;
      const options: RequestOptions & {autoSelectFamily: false} = {
        method: "GET", agent: false, signal, maxHeaderSize: 16 * 1024,
        autoSelectFamily: false,
        lookup: (_hostname, _options, callback) => callback(null, address.address, address.family),
        headers: {Accept: "text/html,application/xhtml+xml", "Accept-Encoding": "identity", "User-Agent": "AiEON/0.1 (website understanding scan)"},
      };
      const request = transport.request(url, options, resolve);
      request.on("error", reject);
      request.on("upgrade", (_response, socket) => {
        socket.destroy();
        reject(new WebsiteFetchError("The website did not return an HTML page."));
      });
      request.end();
    });
  }
}
