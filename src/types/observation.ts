/**
 * AiEON Observation Model
 *
 * Type definitions for raw signals collected during website discovery.
 * Observations are uninterpreted facts extracted from a page — they capture
 * what was found and where, before any reasoning or evidence mapping occurs.
 */

/**
 * Category of DOM or page surface from which an observation was extracted.
 * Describes the structural role of the source element, not its semantic meaning.
 */
export type ObservationSourceType =
  | "heading"
  | "paragraph"
  | "metadata"
  | "schema"
  | "image"
  | "link"
  | "button"
  | "review"
  | "faq";

/**
 * A single raw observation collected by the Discovery Engine before any
 * interpretation, classification, or mapping to structured evidence.
 */
export interface Observation {
  /** Stable unique identifier for this observation within a discovery run. */
  id: string;

  /** Absolute URL of the page where the observation was extracted. */
  pageUrl: string;

  /** Structural category of the source element or page artifact. */
  sourceType: ObservationSourceType;

  /** CSS selector locating the source element on the page, when applicable. */
  selector: string;

  /** Unprocessed text or value as extracted from the source, with no inference applied. */
  rawValue: string;

  /** Extraction confidence on a 0–1 scale, where 1 indicates highest certainty. */
  confidence: number;

  /** ISO 8601 timestamp recording when this observation was discovered. */
  discoveredAt: string;
}
