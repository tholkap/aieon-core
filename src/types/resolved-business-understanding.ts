/**
 * AiEON Resolved Business Understanding Model
 *
 * Type definitions for interpreted offering and positioning produced from raw
 * observations. Resolved business understanding reflects cross-source agreement
 * and explicit reasoning — never single-observation inference or invented copy.
 *
 * Maps to framework questions Q2–Q6 in business-understanding-framework.md:
 * value, offerings, audience, problems, and differentiation.
 */

/**
 * Interpreted business understanding profile built from multiple observations.
 *
 * Fields are populated only when deterministic rules and explicit evidence
 * support them. Unresolved values remain empty strings or empty arrays.
 * Extraction and interpretation logic live in dedicated interpreter modules —
 * this interface defines the output contract only.
 */
export interface ResolvedBusinessUnderstanding {
  /**
   * Primary value the business delivers to customers or stakeholders.
   *
   * Typically derived from hero headings, meta descriptions, or about-page
   * copy when multiple observations corroborate the same normalized statement.
   * Maps to framework question: "What value do they create?"
   */
  valueCreated: string;

  /** Named products the organization sells or maintains. */
  products: string[];

  /** Services the organization provides to customers or clients. */
  services: string[];

  /**
   * Industry verticals or sectors the business operates within.
   *
   * Only populated when explicitly stated in copy, navigation, or structured
   * data — not inferred from product category alone.
   */
  industries: string[];

  /**
   * Segments, personas, or markets the offering is explicitly aimed at.
   *
   * Maps to framework question: "Who do they help?"
   * Each entry must trace to verbatim or rule-extracted audience descriptors.
   */
  targetAudience: string[];

  /**
   * Customer pain points or challenges the offering is designed to address.
   *
   * Maps to framework question: "What problems do they solve?"
   * Problems must appear in source material; they are not inferred from offerings alone.
   */
  problemsSolved: string[];

  /**
   * Results or benefits customers can reasonably expect after engagement.
   *
   * Distinct from `valueCreated` — outcomes describe post-engagement results,
   * not the upfront value proposition statement.
   */
  expectedOutcomes: string[];

  /**
   * Unique selling proposition — what sets the offer apart from alternatives.
   *
   * Maps to framework question: "Why choose them?"
   * Only populated when explicitly stated; marketing superlatives without
   * supporting observations are not treated as verified USPs.
   */
  usp: string;

  /**
   * How pricing is structured when explicitly stated on the site.
   *
   * Examples: subscription, one-time, tiered, usage-based, custom quote.
   * Empty when no pricing model is observable from public pages.
   */
  pricingModel: string;

  /**
   * How the offer is fulfilled when explicitly stated on the site.
   *
   * Examples: SaaS, on-site, hybrid, self-serve, managed service.
   * Empty when delivery method is not stated in source material.
   */
  deliveryModel: string;

  /**
   * Concrete scenarios or applications where the offer applies.
   *
   * Each entry represents an explicitly described use case from product pages,
   * case studies, or FAQ content — not inferred from industry or product name.
   */
  useCases: string[];

  /**
   * Resolution certainty for this profile on a 0–1 scale.
   *
   * Reflects how many framework fields were populated through multi-source
   * or explicit evidence — not an Ion score and not an LLM confidence estimate.
   */
  confidence: number;

  /** Observation IDs that contributed to this business understanding interpretation. */
  evidence: string[];

  /** Step-by-step explanation of every deterministic decision applied. */
  reasoning: string[];
}
