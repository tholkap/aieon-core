import type {
  Observation,
  ObservationSourceType,
} from "@/src/types/observation";
import type { ResolvedBusinessUnderstanding } from "@/src/types/resolved-business-understanding";

/** Confidence when no business understanding fields have been resolved. */
const UNRESOLVED_CONFIDENCE = 0;

/**
 * Existing {@link ObservationSourceType} values used for product name extraction.
 *
 * `link` maps to navigation-sourced product labels. `metadata` and `schema` map
 * to structured metadata. `heading` maps to product headings on listing pages.
 */
const PRODUCT_SOURCE_TYPES = new Set<ObservationSourceType>([
  "heading",
  "metadata",
  "schema",
  "link",
]);

/**
 * Forward-compatible source type labels not yet in {@link ObservationSourceType}.
 *
 * When discovery adds `navigation`, `product`, or list-item types, they are
 * recognized without modifying this interpreter's eligibility logic.
 */
const PRODUCT_SOURCE_TYPE_ALIASES = new Set([
  "navigation",
  "product",
  "list",
  "list item",
]);

/** Metadata selectors that carry page-level descriptors, not product names. */
const NON_PRODUCT_METADATA_SELECTORS = new Set([
  "title",
  'meta[name="description"]',
]);

/**
 * Navigation labels that are explicitly excluded from product extraction.
 *
 * Deterministic blocklist only — generic wayfinding copy is not a product name.
 */
const NON_PRODUCT_NAVIGATION_LABELS = new Set([
  "home",
  "about",
  "about us",
  "contact",
  "contact us",
  "blog",
  "news",
  "login",
  "log in",
  "sign in",
  "sign up",
  "signup",
  "register",
  "privacy",
  "terms",
  "careers",
  "faq",
  "help",
  "support",
  "menu",
]);

/** Result of Version 1 product extraction from eligible observations. */
interface ProductExtractionResult {
  products: string[];
  evidence: string[];
}

/**
 * Aggregates raw observations into a {@link ResolvedBusinessUnderstanding} profile.
 *
 * BusinessUnderstandingInterpreter is an **aggregation interpreter** — it synthesizes
 * offering, positioning, and audience signals across multiple observation sources.
 * It is not an identity resolver; brand and legal identity belong to
 * {@link IdentityInterpreter}.
 *
 * Framework questions served: Q2–Q6
 * - What value do they create?
 * - What do they offer?
 * - Who do they help?
 * - What problems do they solve?
 * - Why choose them?
 *
 * Version 1:
 * - Deterministic `products` extraction from eligible observation source types
 * - All other fields remain empty until future rules are implemented
 *
 * This class never uses an LLM and never calculates Ion scores.
 *
 * ---
 * TODO: Value Proposition — extract `valueCreated` from hero H1, meta description,
 *   and about-page copy; require multi-source corroboration before resolution.
 *
 * TODO: Services — extract service offerings from services sections, nav labels,
 *   and JSON-LD `Service` schema; each entry must trace to an observation.
 *
 * TODO: Industries — extract stated industry verticals from copy and structured data;
 *   never infer from product names or domain alone.
 *
 * TODO: Target Audience — extract explicit audience descriptors from hero copy,
 *   "who we serve" sections, and schema `audience` fields; map to `targetAudience`.
 *
 * TODO: Problems Solved — extract problem statements from problem/solution sections,
 *   FAQ entries, and case study before-states; map to `problemsSolved`.
 *
 * TODO: Expected Outcomes — extract stated results and benefits distinct from
 *   upfront value proposition; map to `expectedOutcomes`.
 *
 * TODO: USP — extract unique selling propositions from "why choose us" sections
 *   and taglines; map to `usp`; do not treat unsubstantiated superlatives as verified.
 *
 * TODO: Pricing Model — extract pricing structure labels when explicitly stated
 *   (subscription, tiered, custom quote); map to `pricingModel`.
 *
 * TODO: Delivery Model — extract fulfillment method when explicitly stated
 *   (SaaS, on-site, hybrid); map to `deliveryModel`.
 *
 * TODO: Use Cases — extract described scenarios from product pages, case studies,
 *   and FAQ; map to `useCases`; no inference from industry or product name alone.
 * ---
 */
export class BusinessUnderstandingInterpreter {
  /**
   * Builds a business understanding profile from all supplied observations.
   *
   * Version 1 applies deterministic product extraction only. Every other field
   * remains at its empty default. No values are inferred beyond explicit
   * observation text from eligible sources.
   *
   * @param observations - Raw observations collected by the discovery pipeline.
   * @returns A {@link ResolvedBusinessUnderstanding} with products populated when eligible.
   */
  interpret(observations: Observation[]): ResolvedBusinessUnderstanding {
    const reasoning: string[] = [
      `Received ${observations.length} observation(s) for business understanding aggregation.`,
      "Version 1 — deterministic product extraction only; all other fields remain empty.",
      "No values are inferred. Missing evidence is acceptable per AiEON constitution.",
    ];

    const productResult = this.extractProducts(observations, reasoning);

    reasoning.push(
      productResult.products.length > 0
        ? `Extracted ${productResult.products.length} product name(s) from eligible observations.`
        : "No product names extracted — no eligible observations with explicit product labels.",
    );

    return {
      ...this.emptyBusinessUnderstanding(),
      products: productResult.products,
      evidence: productResult.evidence,
      reasoning,
    };
  }

  /**
   * Returns a {@link ResolvedBusinessUnderstanding} with all fields at their empty defaults.
   *
   * Scalar fields are empty strings. Collection fields are empty arrays.
   * Confidence is `0` (unresolved). Evidence is empty — no observation IDs are
   * linked until extraction rules assign field provenance.
   */
  emptyBusinessUnderstanding(): ResolvedBusinessUnderstanding {
    return {
      valueCreated: "",
      products: [],
      services: [],
      industries: [],
      targetAudience: [],
      problemsSolved: [],
      expectedOutcomes: [],
      usp: "",
      pricingModel: "",
      deliveryModel: "",
      useCases: [],
      confidence: UNRESOLVED_CONFIDENCE,
      evidence: [],
      reasoning: [],
    };
  }

  /**
   * Extracts explicit product names from eligible observations.
   *
   * Version 1 rules:
   * - Only observations whose source type indicates navigation, product, heading,
   *   list item, or structured metadata are considered
   * - Product name is the trimmed verbatim `rawValue` — never inferred
   * - Case-insensitive deduplication; first-seen display casing is preserved
   * - Observation IDs for accepted products are recorded in evidence
   */
  private extractProducts(
    observations: Observation[],
    reasoning: string[],
  ): ProductExtractionResult {
    const seenNormalized = new Set<string>();
    const products: string[] = [];
    const evidence: string[] = [];

    reasoning.push(
      "Beginning product extraction — evaluating observations for eligible source types only.",
    );

    for (const observation of observations) {
      if (!this.isProductEligibleObservation(observation)) {
        continue;
      }

      const productName = observation.rawValue.trim();

      if (!productName) {
        reasoning.push(
          `Skipped observation ${observation.id} — eligible source type but empty rawValue.`,
        );
        continue;
      }

      if (this.isBlockedNavigationLabel(observation, productName)) {
        reasoning.push(
          `Skipped observation ${observation.id} — navigation label "${productName}" is on the non-product blocklist.`,
        );
        continue;
      }

      const normalized = productName.toLowerCase();

      if (seenNormalized.has(normalized)) {
        reasoning.push(
          `Skipped observation ${observation.id} — duplicate product name "${productName}" (case-insensitive match).`,
        );
        continue;
      }

      seenNormalized.add(normalized);
      products.push(productName);
      evidence.push(observation.id);

      reasoning.push(
        `Accepted product "${productName}" from observation ${observation.id} (sourceType: ${observation.sourceType}, selector: ${observation.selector}).`,
      );
    }

    return { products, evidence };
  }

  /**
   * Determines whether an observation may contribute an explicit product name.
   *
   * Eligible when sourceType is heading, metadata, schema, or link (navigation),
   * when sourceType matches a forward-compatible alias (product, list item, navigation),
   * or when the selector indicates a list item (`li`) on paragraph observations.
   */
  private isProductEligibleObservation(observation: Observation): boolean {
    if (PRODUCT_SOURCE_TYPES.has(observation.sourceType)) {
      if (
        observation.sourceType === "metadata" &&
        NON_PRODUCT_METADATA_SELECTORS.has(observation.selector)
      ) {
        return false;
      }

      return true;
    }

    if (PRODUCT_SOURCE_TYPE_ALIASES.has(observation.sourceType)) {
      return true;
    }

    if (this.isListItemObservation(observation)) {
      return true;
    }

    return false;
  }

  /**
   * Identifies list-item observations when list source types are not yet emitted.
   *
   * Matches selectors that locate `<li>` elements (e.g. `li`, `ul li`, `.products li`).
   */
  private isListItemObservation(observation: Observation): boolean {
    const selector = observation.selector.trim().toLowerCase();

    return (
      selector === "li" ||
      selector.endsWith(" li") ||
      selector.includes(" li ")
    );
  }

  /**
   * Applies the deterministic navigation blocklist to link-sourced observations.
   */
  private isBlockedNavigationLabel(
    observation: Observation,
    productName: string,
  ): boolean {
    if (observation.sourceType !== "link") {
      return false;
    }

    return NON_PRODUCT_NAVIGATION_LABELS.has(productName.toLowerCase());
  }
}
