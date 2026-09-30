import { WebsiteCrawler, type CrawlCoverage } from "@/src/core/discovery/WebsiteCrawler";
import { IdentityInterpreter } from "@/src/core/interpreter/IdentityInterpreter";
import type { Observation } from "@/src/types/observation";
import type { ResolvedIdentity } from "@/src/types/resolved-identity";

/** Result of a full discovery run including raw observations and interpreted identity. */
export interface DiscoveryRunResult {
  observations: Observation[];
  resolvedIdentity: ResolvedIdentity;
  coverage: CrawlCoverage;
}

/** Structured log payload emitted at each stage of a discovery run. */
interface DiscoveryLogEntry {
  /** Identifies the pipeline stage being recorded. */
  event: string;

  /** ISO 8601 timestamp of when the event occurred. */
  timestamp: string;

  /** Target hostname only; omit URL credentials, paths and queries. */
  targetHost: string;

  /** Optional metadata specific to the event (e.g. byte length, counts). */
  [key: string]: string | number;
}

/**
 * Orchestrates the bounded discovery pipeline for a website.
 *
 * DiscoveryRunner coordinates download, parsing, and identity interpretation.
 * It does not build evidence, calculate Ions, or invoke any AI models.
 *
 * Pipeline:
 *
 * ```
 * URL → WebsiteCrawler.crawl → HtmlParser.parse (per page) → IdentityInterpreter.interpret
 * ```
 */
export class DiscoveryRunner {
  private readonly crawler: WebsiteCrawler;
  private readonly identityInterpreter: IdentityInterpreter;

  /**
   * Creates a runner with the given pipeline collaborators.
   *
   * Defaults to fresh {@link WebsiteCrawler} and {@link IdentityInterpreter}
   * instances when none are supplied.
   */
  constructor(
    crawler?: WebsiteCrawler,
    identityInterpreter?: IdentityInterpreter,
  ) {
    this.crawler = crawler ?? new WebsiteCrawler();
    this.identityInterpreter = identityInterpreter ?? new IdentityInterpreter();
  }

  /**
   * Runs discovery for the given website URL.
   *
   * Downloads the page HTML, parses it into observations, interprets identity,
   * and returns both results. Emits structured logs at each pipeline stage.
   *
   * @param url - Absolute HTTP or HTTPS URL of the page to discover.
   * @returns Observations and the interpreted identity profile.
   */
  async run(url: string): Promise<DiscoveryRunResult> {
    this.log("fetch_started", url);

    const { observations, coverage } = await this.crawler.crawl(url);

    this.log("crawl_completed", url, {
      pagesDiscovered: coverage.pagesDiscovered,
      pagesScanned: coverage.pagesScanned,
      pagesFailed: coverage.pagesFailed,
      pageLimit: coverage.pageLimit,
    });

    this.log("parsing_completed", url, {
      observationCount: observations.length,
    });

    this.log("observations_collected", url, {
      totalObservations: observations.length,
    });

    this.log("interpretation_started", url);

    const resolvedIdentity = this.identityInterpreter.interpret(observations);

    this.log("interpretation_completed", url, {
      primaryBrand: resolvedIdentity.primaryBrand || "(unresolved)",
      confidence: resolvedIdentity.confidence,
    });

    return { observations, resolvedIdentity, coverage };
  }

  /**
   * Emits a single structured JSON log line for observability and debugging.
   *
   * Each entry includes a stable event name, ISO timestamp, target hostname, and
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
      targetHost: (() => { try { return new URL(url).hostname; } catch { return "invalid"; } })(),
      ...metadata,
    };

    console.log(JSON.stringify(entry));
  }
}
