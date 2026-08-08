/**
 * AiEON Observation Model
 *
 * Observations are uninterpreted facts extracted from a page — what was found
 * and where, before any reasoning or evidence mapping occurs.
 *
 * Constitutional principle: observation types describe where information came
 * from, never what the business means.
 */

/**
 * Canonical structural origin of an observation.
 *
 * Identifies the HTML or page artifact an observation was extracted from.
 * Structural origin only — never interpreted business meaning.
 */
export type ObservationSourceType =
  /** Document `<title>` element text. */
  | "title"
  /** `<meta name="description">` content attribute. */
  | "meta-description"
  /** First `<h1>` element text. */
  | "h1"
  /** `<h2>` element text. */
  | "h2"
  /** `<h3>` element text. */
  | "h3"
  /** Anchor text from a link inside `<nav>`. */
  | "navigation-link"
  /** Anchor text from a link inside `<footer>`. */
  | "footer-link"
  /** `<button>` element text. */
  | "button"
  /** `<li>` element text in an unordered or ordered list. */
  | "list-item"
  /** Raw JSON-LD script block (future extractors). */
  | "json-ld"
  /** Organization structured data fields (future extractors). */
  | "organization-schema"
  /** Product structured data fields (future extractors). */
  | "product-schema"
  /** Image alt text or asset reference (future extractors). */
  | "image"
  /** Review or testimonial content (future extractors). */
  | "review"
  /** FAQ question or answer content (future extractors). */
  | "faq";

/** Structural source types emitted by {@link HtmlParser}. */
export type HtmlParserSourceType = Extract<
  ObservationSourceType,
  | "title"
  | "meta-description"
  | "h1"
  | "h2"
  | "h3"
  | "navigation-link"
  | "footer-link"
  | "button"
  | "list-item"
>;

/**
 * A single raw observation collected by the Discovery Engine before any
 * interpretation, classification, or mapping to structured evidence.
 */
export interface Observation {
  id: string;
  pageUrl: string;
  sourceType: ObservationSourceType;
  selector: string;
  rawValue: string;
  confidence: number;
  discoveredAt: string;
}
