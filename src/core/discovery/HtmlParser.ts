import { load, type Cheerio, type CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";

import type {
  HtmlParserSourceType,
  Observation,
} from "@/src/types/observation";

interface ObservationDraft {
  pageUrl: string;
  discoveredAt: string;
  selector: string;
  sourceType: HtmlParserSourceType;
  rawValue: string | undefined;
}

interface ExtractionContext {
  pageUrl: string;
  discoveredAt: string;
  observations: Observation[];
}

interface SingleExtractionRule {
  selector: string;
  sourceType: HtmlParserSourceType;
  readValue: ($: CheerioAPI) => string | undefined;
}

interface IndexedExtractionRule {
  selector: string;
  sourceType: HtmlParserSourceType;
  readValue: (element: Cheerio<AnyNode>) => string;
}

const DIRECT_EXTRACTION_CONFIDENCE = 1;

const readElementText = ($element: Cheerio<AnyNode>): string => $element.text();

const SINGLE_EXTRACTIONS: ReadonlyArray<SingleExtractionRule> = [
  {
    selector: "title",
    sourceType: "title",
    readValue: ($) => $("title").first().text().trim(),
  },
  {
    selector: 'meta[name="description"]',
    sourceType: "meta-description",
    readValue: ($) => $('meta[name="description"]').first().attr("content")?.trim(),
  },
  {
    selector: "h1",
    sourceType: "h1",
    readValue: ($) => $("h1").first().text().trim(),
  },
];

const INDEXED_EXTRACTIONS: ReadonlyArray<IndexedExtractionRule> = [
  { selector: "h2", sourceType: "h2", readValue: readElementText },
  { selector: "h3", sourceType: "h3", readValue: readElementText },
  { selector: "nav a", sourceType: "navigation-link", readValue: readElementText },
  { selector: "footer a", sourceType: "footer-link", readValue: readElementText },
  { selector: "button", sourceType: "button", readValue: readElementText },
  { selector: "li", sourceType: "list-item", readValue: readElementText },
];

/**
 * Parses raw HTML into uninterpreted {@link Observation} records.
 *
 * Extraction is fully configuration-driven via {@link SINGLE_EXTRACTIONS} and
 * {@link INDEXED_EXTRACTIONS}. Discovery performs no inference and no classification.
 */
export class HtmlParser {
  parse(html: string, pageUrl: string): Observation[] {
    const $ = load(html);
    const context: ExtractionContext = {
      pageUrl,
      discoveredAt: new Date().toISOString(),
      observations: [],
    };

    this.runExtractionPipeline($, context);

    return context.observations;
  }

  /** Declarative extraction pipeline — singles first, then indexed, in config order. */
  private runExtractionPipeline($: CheerioAPI, context: ExtractionContext): void {
    for (const rule of SINGLE_EXTRACTIONS) {
      this.appendObservation(context.observations, {
        pageUrl: context.pageUrl,
        discoveredAt: context.discoveredAt,
        selector: rule.selector,
        sourceType: rule.sourceType,
        rawValue: rule.readValue($),
      });
    }

    for (const rule of INDEXED_EXTRACTIONS) {
      this.extractIndexedElements($, context, rule);
    }
  }

  private extractIndexedElements(
    $: CheerioAPI,
    context: ExtractionContext,
    rule: IndexedExtractionRule,
  ): void {
    $(rule.selector).each((index, element) => {
      this.appendObservation(context.observations, {
        pageUrl: context.pageUrl,
        discoveredAt: context.discoveredAt,
        selector: this.createIndexedSelector(rule.selector, index),
        sourceType: rule.sourceType,
        rawValue: rule.readValue($(element)).trim(),
      });
    });
  }

  private appendObservation(
    observations: Observation[],
    draft: ObservationDraft,
  ): void {
    if (!draft.rawValue) {
      return;
    }

    observations.push({
      id: this.createObservationId(draft.pageUrl, draft.selector),
      pageUrl: draft.pageUrl,
      sourceType: draft.sourceType,
      selector: draft.selector,
      rawValue: draft.rawValue,
      confidence: DIRECT_EXTRACTION_CONFIDENCE,
      discoveredAt: draft.discoveredAt,
    });
  }

  private createIndexedSelector(baseSelector: string, index: number): string {
    return `${baseSelector}@${index}`;
  }

  private createObservationId(pageUrl: string, selector: string): string {
    return `${pageUrl}::${selector}`;
  }
}
