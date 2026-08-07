import { load, type CheerioAPI } from "cheerio";

import type { Observation, ObservationSourceType } from "@/src/types/observation";

/**
 * Confidence assigned to direct, selector-based DOM reads.
 *
 * These values are not computed scores — they reflect that the extracted
 * text came verbatim from a matched element with no interpretation applied.
 */
const DIRECT_EXTRACTION_CONFIDENCE = 1;

/** CSS selector for the document title element. */
const TITLE_SELECTOR = "title";

/** CSS selector for the standard meta description tag. */
const META_DESCRIPTION_SELECTOR = 'meta[name="description"]';

/** CSS selector for the first top-level heading on the page. */
const FIRST_H1_SELECTOR = "h1";

/**
 * Parses raw HTML into uninterpreted {@link Observation} records.
 *
 * HtmlParser is a structural extraction layer only. It loads HTML with Cheerio,
 * reads a fixed set of Version 1 selectors, and emits one observation per match.
 * It does not infer meaning, build evidence, or invoke any AI models.
 *
 * Typical pipeline:
 *
 * ```
 * WebsiteFetcher.fetchHtml(url) → HTML string → HtmlParser.parse(html, url) → Observation[]
 * ```
 */
export class HtmlParser {
  /**
   * Extracts Version 1 observations from a raw HTML document.
   *
   * Loads the HTML string, attempts each supported selector independently,
   * and returns every observation that produced a non-empty raw value.
   * Missing elements are skipped silently — no placeholder observations
   * are created.
   *
   * @param html - Raw HTML string, typically from {@link WebsiteFetcher.fetchHtml}.
   * @param pageUrl - Absolute URL of the page the HTML was fetched from.
   * @returns An array of observations, one per successfully extracted element.
   */
  parse(html: string, pageUrl: string): Observation[] {
    const $ = load(html);
    const discoveredAt = new Date().toISOString();
    const observations: Observation[] = [];

    this.extractTitle($, pageUrl, discoveredAt, observations);
    this.extractMetaDescription($, pageUrl, discoveredAt, observations);
    this.extractFirstH1($, pageUrl, discoveredAt, observations);

    return observations;
  }

  /**
   * Extracts the document `<title>` element when present and non-empty.
   *
   * The title is classified as metadata because it lives in the document
   * head and describes the page rather than visible body content.
   */
  private extractTitle(
    $: CheerioAPI,
    pageUrl: string,
    discoveredAt: string,
    observations: Observation[],
  ): void {
    const rawValue = $(TITLE_SELECTOR).first().text().trim();

    this.appendObservationIfPresent(observations, {
      pageUrl,
      discoveredAt,
      selector: TITLE_SELECTOR,
      sourceType: "metadata",
      rawValue,
    });
  }

  /**
   * Extracts the `content` attribute of `<meta name="description">` when present.
   *
   * Only the standard description meta tag is considered. Alternate or duplicate
   * description tags are ignored in Version 1.
   */
  private extractMetaDescription(
    $: CheerioAPI,
    pageUrl: string,
    discoveredAt: string,
    observations: Observation[],
  ): void {
    const rawValue = $(META_DESCRIPTION_SELECTOR).first().attr("content")?.trim();

    this.appendObservationIfPresent(observations, {
      pageUrl,
      discoveredAt,
      selector: META_DESCRIPTION_SELECTOR,
      sourceType: "metadata",
      rawValue,
    });
  }

  /**
   * Extracts the text content of the first `<h1>` element when present.
   *
   * Only the first matching heading is collected. Additional H1 elements
   * on the same page are intentionally ignored in Version 1.
   */
  private extractFirstH1(
    $: CheerioAPI,
    pageUrl: string,
    discoveredAt: string,
    observations: Observation[],
  ): void {
    const rawValue = $(FIRST_H1_SELECTOR).first().text().trim();

    this.appendObservationIfPresent(observations, {
      pageUrl,
      discoveredAt,
      selector: FIRST_H1_SELECTOR,
      sourceType: "heading",
      rawValue,
    });
  }

  /**
   * Appends a fully populated observation when a raw value exists.
   *
   * Empty, whitespace-only, or absent values produce no observation.
   * This keeps the output limited to facts actually present in the HTML.
   */
  private appendObservationIfPresent(
    observations: Observation[],
    fields: {
      pageUrl: string;
      discoveredAt: string;
      selector: string;
      sourceType: ObservationSourceType;
      rawValue: string | undefined;
    },
  ): void {
    if (!fields.rawValue) {
      return;
    }

    observations.push({
      id: this.createObservationId(fields.pageUrl, fields.selector),
      pageUrl: fields.pageUrl,
      sourceType: fields.sourceType,
      selector: fields.selector,
      rawValue: fields.rawValue,
      confidence: DIRECT_EXTRACTION_CONFIDENCE,
      discoveredAt: fields.discoveredAt,
    });
  }

  /**
   * Builds a stable identifier for an observation within a discovery run.
   *
   * Combines the page URL and CSS selector so each extracted element maps
   * to a single, reproducible id without requiring random or sequential keys.
   */
  private createObservationId(pageUrl: string, selector: string): string {
    return `${pageUrl}::${selector}`;
  }
}
