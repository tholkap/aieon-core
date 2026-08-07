import type { AiEONEvidence } from "@/src/types/evidence";
import type { Observation } from "@/src/types/observation";

/** CSS selector used by {@link HtmlParser} for the document title observation. */
const TITLE_SELECTOR = "title";

/** CSS selector used by {@link HtmlParser} for the first H1 observation. */
const FIRST_H1_SELECTOR = "h1";

/**
 * Transforms raw {@link Observation} records into structured {@link AiEONEvidence}.
 *
 * EvidenceBuilder applies deterministic mapping rules only — no AI, no inference,
 * and no invented values. Unmapped fields remain at their empty defaults.
 */
export class EvidenceBuilder {
  /**
   * Builds a Version 1 evidence profile from collected observations.
   *
   * Populates only `identity.businessName`, `identity.website`, and
   * `knowledge.valueProposition`. Every other evidence field is left empty.
   *
   * @param observations - Raw observations produced by the discovery pipeline.
   * @param pageUrl - Absolute URL of the page that was discovered.
   * @returns A complete {@link AiEONEvidence} object with Version 1 fields filled.
   */
  build(observations: Observation[], pageUrl: string): AiEONEvidence {
    const titleObservation = this.findTitleObservation(observations);
    const h1Observation = this.findFirstH1Observation(observations);

    return {
      identity: {
        ...this.emptyIdentity(),
        /** Parsed from the title when it contains "|" or "-" — text before the first separator. */
        businessName: titleObservation
          ? this.extractBusinessNameFromTitle(titleObservation.rawValue)
          : "",
        /** Hostname extracted directly from the supplied page URL. */
        website: this.extractWebsiteHostname(pageUrl),
      },
      knowledge: {
        ...this.emptyKnowledge(),
        /** Verbatim text from the first H1 observation, when present. */
        valueProposition: h1Observation?.rawValue ?? "",
      },
      trust: this.emptyTrust(),
      authority: this.emptyAuthority(),
      conversation: this.emptyConversation(),
      action: this.emptyAction(),
    };
  }

  /**
   * Locates the document title observation emitted by the HTML parser.
   *
   * Matches metadata observations whose selector is the literal `title` element.
   */
  private findTitleObservation(
    observations: Observation[],
  ): Observation | undefined {
    return observations.find(
      (observation) =>
        observation.sourceType === "metadata" &&
        observation.selector === TITLE_SELECTOR,
    );
  }

  /**
   * Locates the first H1 observation emitted by the HTML parser.
   *
   * Matches heading observations whose selector is the literal `h1` element.
   */
  private findFirstH1Observation(
    observations: Observation[],
  ): Observation | undefined {
    return observations.find(
      (observation) =>
        observation.sourceType === "heading" &&
        observation.selector === FIRST_H1_SELECTOR,
    );
  }

  /**
   * Derives a business name from a raw HTML title string.
   *
   * Version 1 rule: when the title contains `|` or `-`, return the trimmed
   * text before whichever separator appears first. If neither separator is
   * present, return an empty string — the full title is not assumed to be
   * the business name.
   *
   * Example: `"Viva Flora Qatar | Flower Delivery Qatar"` → `"Viva Flora Qatar"`
   */
  private extractBusinessNameFromTitle(title: string): string {
    const pipeIndex = title.indexOf("|");
    const dashIndex = title.indexOf("-");

    const separatorIndex = this.firstSeparatorIndex(pipeIndex, dashIndex);

    if (separatorIndex === -1) {
      return "";
    }

    return title.slice(0, separatorIndex).trim();
  }

  /**
   * Returns the index of the earliest title separator, or -1 when none exist.
   */
  private firstSeparatorIndex(
    pipeIndex: number,
    dashIndex: number,
  ): number {
    if (pipeIndex === -1) {
      return dashIndex;
    }

    if (dashIndex === -1) {
      return pipeIndex;
    }

    return Math.min(pipeIndex, dashIndex);
  }

  /**
   * Extracts the hostname from the supplied page URL.
   *
   * Version 1 rule: use the URL hostname as the canonical website value.
   * Returns an empty string when the URL cannot be parsed.
   */
  private extractWebsiteHostname(pageUrl: string): string {
    try {
      return new URL(pageUrl).hostname;
    } catch {
      return "";
    }
  }

  /** Returns an identity evidence object with all Version 1 fields empty. */
  private emptyIdentity() {
    return {
      businessName: "",
      brandName: "",
      logo: "",
      tagline: "",
      coreIdea: "",
      mission: "",
      vision: "",
      address: "",
      city: "",
      country: "",
      phone: "",
      email: "",
      website: "",
      socialProfiles: [] as string[],
      majorAudience: "",
    };
  }

  /** Returns a knowledge evidence object with all Version 1 fields empty. */
  private emptyKnowledge() {
    return {
      products: [] as string[],
      services: [] as string[],
      industries: [] as string[],
      expertise: [] as string[],
      usp: "",
      valueProposition: "",
      problemsSolved: [] as string[],
      expectedOutcomes: [] as string[],
      pricingModel: "",
      deliveryModel: "",
      targetAudience: [] as string[],
      useCases: [] as string[],
    };
  }

  /** Returns a trust evidence object with all fields empty. */
  private emptyTrust() {
    return {
      reviews: [] as string[],
      certifications: [] as string[],
      policies: [] as string[],
      transparency: "",
      contactConsistency: "",
      freshness: "",
      authorInformation: "",
    };
  }

  /** Returns an authority evidence object with all fields empty. */
  private emptyAuthority() {
    return {
      mentions: [] as string[],
      citations: [] as string[],
      publications: [] as string[],
      partnerships: [] as string[],
      awards: [] as string[],
      originalResearch: [] as string[],
      educationalContent: [] as string[],
      caseStudies: [] as string[],
      customerStories: [] as string[],
      contributionQuality: "",
    };
  }

  /** Returns a conversation evidence object with all fields empty. */
  private emptyConversation() {
    return {
      whoIsThisFor: "",
      whyChooseUs: "",
      problemsSolved: [] as string[],
      differentiators: [] as string[],
      readability: "",
      clarity: "",
      solutionClarity: "",
      ctaClarity: "",
      aiSummaryConfidence: "",
    };
  }

  /** Returns an action evidence object with all fields empty. */
  private emptyAction() {
    return {
      buy: "",
      book: "",
      contact: "",
      reserve: "",
      subscribe: "",
      share: "",
      read: "",
      connect: "",
      create: "",
      emote: "",
    };
  }
}
