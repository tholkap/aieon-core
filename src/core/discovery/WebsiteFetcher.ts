/** Default request timeout in milliseconds when none is configured. */
const DEFAULT_TIMEOUT_MS = 15_000;

/** HTTP and HTTPS are the only schemes accepted for public website fetches. */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export interface WebsiteFetcherOptions {
  /** Maximum time to wait for a response before aborting the request. */
  timeoutMs?: number;
}

/**
 * Downloads raw HTML from public websites using the native Fetch API.
 *
 * WebsiteFetcher is a transport layer only — it validates the URL, performs
 * the HTTP request, and returns the response body as a string. It does not
 * parse HTML, inspect content, or invoke any AI models.
 */
export class WebsiteFetcher {
  private readonly timeoutMs: number;

  /**
   * Creates a fetcher instance.
   *
   * @param options - Optional configuration such as request timeout duration.
   */
  constructor(options: WebsiteFetcherOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * Downloads and returns the raw HTML for the given URL.
   *
   * Validates the URL, issues a GET request, enforces a timeout, and rejects
   * non-successful HTTP responses. The returned string is the unmodified
   * response body — no parsing or analysis is performed.
   *
   * @param url - Absolute HTTP or HTTPS URL of the page to download.
   * @returns The response body as a raw HTML string.
   * @throws When the URL is invalid, the network fails, the request times out,
   *   or the server returns a non-200 status code.
   */
  async fetchHtml(url: string): Promise<string> {
    const parsedUrl = this.parseUrl(url);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(parsedUrl.toString(), {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Request failed with status ${response.status} for ${parsedUrl.toString()}`,
        );
      }

      return await response.text();
    } catch (error) {
      throw this.toFetchError(error, parsedUrl.toString());
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parses and validates that a string is a usable HTTP or HTTPS URL.
   *
   * Rejects empty input, malformed URLs, and unsupported schemes such as
   * `file:` or `javascript:` before any network request is attempted.
   *
   * @param url - Raw URL string supplied by the caller.
   * @returns A validated {@link URL} instance.
   * @throws When the string is empty, syntactically invalid, or uses a
   *   disallowed protocol.
   */
  private parseUrl(url: string): URL {
    const trimmed = url.trim();

    if (!trimmed) {
      throw new Error("URL must not be empty");
    }

    let parsed: URL;

    try {
      parsed = new URL(trimmed);
    } catch {
      throw new Error(`Invalid URL: ${trimmed}`);
    }

    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      throw new Error(
        `Unsupported URL protocol "${parsed.protocol}" — only HTTP and HTTPS are allowed`,
      );
    }

    return parsed;
  }

  /**
   * Normalizes low-level fetch failures into descriptive, caller-facing errors.
   *
   * Distinguishes timeout aborts from other network or runtime failures so
   * upstream code can report meaningful messages without inspecting cause chains.
   *
   * @param error - The error thrown by fetch or response handling.
   * @param url - The validated URL that was requested.
   * @returns A new {@link Error} with a human-readable message.
   */
  private toFetchError(error: unknown, url: string): Error {
    if (error instanceof Error && error.name === "AbortError") {
      return new Error(
        `Request timed out after ${this.timeoutMs}ms for ${url}`,
      );
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error(`Network request failed for ${url}`);
  }
}
