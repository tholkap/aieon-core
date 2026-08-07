import { HtmlParser } from "@/src/core/discovery/HtmlParser";
import { WebsiteFetcher } from "@/src/core/discovery/WebsiteFetcher";
import type { Observation } from "@/src/types/observation";

/** Structured log payload emitted at each stage of a discovery run. */
interface DiscoveryLogEntry {
  /** Identifies the pipeline stage being recorded. */
  event: string;

  /** ISO 8601 timestamp of when the event occurred. */
  timestamp: string;

  /** Absolute URL of the website under discovery. */
  url: string;

  /** Optional metadata specific to the event (e.g. byte length, counts). */
  [key: string]: string | number;
}

/**
 * Orchestrates the raw discovery pipeline for a single website URL.
 *
 * DiscoveryRunner coordinates download and parsing only. It fetches HTML,
 * converts it into {@link Observation} records, and returns them unchanged.
 * It does not build evidence, calculate Ions, or invoke any AI models.
 *
 * Pipeline:
 *
 * ```
 * URL → WebsiteFetcher.fetchHtml → HtmlParser.parse → Observation[]
 * ```
 */
export class DiscoveryRunner {
  private readonly fetcher: WebsiteFetcher;
  private readonly parser: HtmlParser;

  /**
   * Creates a runner with the given fetch and parse collaborators.
   *
   * Defaults to fresh {@link WebsiteFetcher} and {@link HtmlParser} instances
   * when none are supplied.
   */
  constructor(fetcher?: WebsiteFetcher, parser?: HtmlParser) {
    this.fetcher = fetcher ?? new WebsiteFetcher();
    this.parser = parser ?? new HtmlParser();
  }

  /**
   * Runs raw discovery for the given website URL.
   *
   * Downloads the page HTML, parses it into observations, and returns the
   * collected results. Emits structured logs at each pipeline stage.
   *
   * @param url - Absolute HTTP or HTTPS URL of the page to discover.
   * @returns All observations extracted from the page HTML.
   */
  async run(url: string): Promise<Observation[]> {
    this.log("fetch_started", url);

    const html = await this.fetcher.fetchHtml(url);

    this.log("fetch_completed", url, { htmlLength: html.length });

    this.log("parsing_started", url);

    const observations = this.parser.parse(html, url);

    this.log("parsing_completed", url, {
      observationCount: observations.length,
    });

    this.log("observations_collected", url, {
      totalObservations: observations.length,
    });

    return observations;
  }

  /**
   * Emits a single structured JSON log line for observability and debugging.
   *
   * Each entry includes a stable event name, ISO timestamp, target URL, and
   * any stage-specific metadata supplied by the caller.
   */
  private log(
    event: string,
    url: string,
    metadata: Record<string, string | number> = {},
  ): void {
    const entry: DiscoveryLogEntry = {
      event,
      timestamp: new Date().toISOString(),
      url,
      ...metadata,
    };

    console.log(JSON.stringify(entry));
  }
}
