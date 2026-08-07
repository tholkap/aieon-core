/**
 * AiEON Resolved Identity Model
 *
 * Type definitions for interpreted business identity produced from raw
 * observations. Unlike evidence, resolved identity reflects cross-source
 * agreement and explicit reasoning — never single-observation inference.
 */

/**
 * Interpreted business identity profile built from multiple observations.
 *
 * Fields are populated only when deterministic rules and explicit evidence
 * support them. Unresolved values remain empty strings or empty arrays.
 */
export interface ResolvedIdentity {
  /** Brand name agreed upon by two or more independent observations. */
  primaryBrand: string;

  /**
   * Registered legal entity name.
   * Only populated when explicit evidence exists (e.g. JSON-LD, footer legal line).
   */
  legalBusinessName: string;

  /**
   * Trading or DBA name when it differs from the legal entity.
   * Only populated when explicitly stated in source material.
   */
  tradingName: string;

  /** Hostname extracted from the discovered page URL. */
  domain: string;

  /** Verbatim text of the HTML document title observation, when present. */
  websiteTitle: string;

  /** All name candidates extracted from supported observation sources. */
  candidateNames: string[];

  /**
   * Country of operation.
   * Only populated when explicit geographic evidence is available.
   */
  operatingCountry: string;

  /**
   * Resolution certainty — 1 when a primary brand is multi-source supported,
   * 0 when no cross-source agreement exists. Not an Ion score.
   */
  confidence: number;

  /** Observation IDs that contributed to this identity interpretation. */
  evidence: string[];

  /** Step-by-step explanation of every deterministic decision applied. */
  reasoning: string[];
}
