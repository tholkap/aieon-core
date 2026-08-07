import type { Observation } from "@/src/types/observation";
import type { ResolvedIdentity } from "@/src/types/resolved-identity";

/** CSS selector used by {@link HtmlParser} for the document title observation. */
const TITLE_SELECTOR = "title";

/** CSS selector used by {@link HtmlParser} for the first H1 observation. */
const FIRST_H1_SELECTOR = "h1";

/** Confidence when a primary brand is supported by multiple observations. */
const RESOLVED_CONFIDENCE = 1;

/** Confidence when no cross-source brand agreement exists. */
const UNRESOLVED_CONFIDENCE = 0;

/**
 * A name candidate extracted from a single observation source.
 *
 * Tracks both the display value and the observation that produced it so
 * cross-source agreement can be evaluated without relying on any one signal.
 */
interface NameCandidate {
  /** Human-readable name string as extracted from the observation. */
  value: string;

  /** Normalized form used only for deterministic equality comparison. */
  normalized: string;

  /** ID of the observation that produced this candidate. */
  observationId: string;
}

/**
 * Interprets raw observations into a {@link ResolvedIdentity} profile.
 *
 * IdentityInterpreter applies deterministic, multi-source rules only.
 * It never uses an LLM, never calculates Ion scores, and never infers
 * legal or trading names without explicit evidence.
 *
 * Version 1 sources:
 * - HTML `<title>`
 * - First `<h1>`
 *
 * TODO: JSON-LD Organization — extract legal name and brand from structured data.
 * TODO: Footer — parse copyright lines and registered entity statements.
 * TODO: Contact Page — read stated business name from contact or about content.
 * TODO: Logo — derive brand from alt text or adjacent label copy.
 * TODO: Google Business Profile — reconcile public listing name against on-site signals.
 * TODO: LinkedIn — match company page name against on-site candidates.
 */
export class IdentityInterpreter {
  /**
   * Builds a business identity profile from all supplied observations.
   *
   * Reads every observation, extracts name candidates from the title and
   * first H1, and resolves a primary brand only when at least two
   * independent observations support the same normalized name.
   *
   * @param observations - Raw observations collected by the discovery pipeline.
   * @returns An interpreted {@link ResolvedIdentity} with reasoning attached.
   */
  interpret(observations: Observation[]): ResolvedIdentity {
    const reasoning: string[] = [];
    const evidence = observations.map((observation) => observation.id);

    reasoning.push(
      `Evaluated ${observations.length} observation(s) — identity is never resolved from a single source alone.`,
    );

    const titleObservation = this.findTitleObservation(observations);
    const h1Observation = this.findFirstH1Observation(observations);

    const websiteTitle = titleObservation?.rawValue ?? "";
    const domain = this.extractDomain(observations);

    reasoning.push(
      domain
        ? `Domain "${domain}" taken from the page URL hostname.`
        : "Domain left empty — no valid page URL found among observations.",
    );

    if (websiteTitle) {
      reasoning.push(
        `Website title recorded verbatim from the title observation: "${websiteTitle}".`,
      );
    } else {
      reasoning.push("Website title left empty — no title observation present.");
    }

    const candidates = this.collectNameCandidates(
      titleObservation,
      h1Observation,
      reasoning,
    );

    const candidateNames = this.uniqueCandidateValues(candidates);

    reasoning.push(
      candidateNames.length > 0
        ? `Stored ${candidateNames.length} unique candidate name(s): ${candidateNames.map((name) => `"${name}"`).join(", ")}.`
        : "No candidate names extracted — title and H1 observations were absent or empty.",
    );

    const primaryBrand = this.resolvePrimaryBrand(candidates, reasoning);

    if (!primaryBrand) {
      reasoning.push(
        "Primary brand left empty — no normalized name was supported by two or more independent observations.",
      );
    }

    reasoning.push(
      "Legal business name left empty — Version 1 requires explicit evidence (e.g. JSON-LD Organization, footer legal line).",
    );
    reasoning.push(
      "Trading name left empty — Version 1 requires an explicitly stated DBA or trading name.",
    );
    reasoning.push(
      "Operating country left empty — Version 1 requires explicit geographic evidence.",
    );

    return {
      primaryBrand,
      legalBusinessName: "",
      tradingName: "",
      domain,
      websiteTitle,
      candidateNames,
      operatingCountry: "",
      confidence: primaryBrand ? RESOLVED_CONFIDENCE : UNRESOLVED_CONFIDENCE,
      evidence,
      reasoning,
    };
  }

  /**
   * Locates the document title observation among all supplied observations.
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
   * Locates the first H1 heading observation among all supplied observations.
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
   * Extracts the hostname from the first observation that carries a page URL.
   *
   * Version 1 rule: domain is always the URL hostname — never inferred from
   * page copy or geographic cues.
   */
  private extractDomain(observations: Observation[]): string {
    const pageUrl = observations.find(
      (observation) => observation.pageUrl.trim().length > 0,
    )?.pageUrl;

    if (!pageUrl) {
      return "";
    }

    try {
      return new URL(pageUrl).hostname;
    } catch {
      return "";
    }
  }

  /**
   * Builds name candidates from every Version 1 identity source.
   *
   * Title rule: emit the full raw title plus, when `|` or `-` is present,
   * the trimmed segment before the first separator — both are stored.
   *
   * H1 rule: emit the full raw heading text as a single candidate.
   */
  private collectNameCandidates(
    titleObservation: Observation | undefined,
    h1Observation: Observation | undefined,
    reasoning: string[],
  ): NameCandidate[] {
    const candidates: NameCandidate[] = [];

    if (titleObservation?.rawValue) {
      const title = titleObservation.rawValue.trim();

      candidates.push(
        this.toNameCandidate(title, titleObservation.id),
      );

      reasoning.push(
        `Title observation contributed full title candidate "${title}".`,
      );

      const titlePrefix = this.extractTitlePrefix(title);

      if (titlePrefix && titlePrefix !== title) {
        candidates.push(
          this.toNameCandidate(titlePrefix, titleObservation.id),
        );

        reasoning.push(
          `Title observation contributed prefix candidate "${titlePrefix}" (text before the first "|" or "-").`,
        );
      }
    } else {
      reasoning.push("Title observation absent — no title-derived candidates added.");
    }

    if (h1Observation?.rawValue) {
      const heading = h1Observation.rawValue.trim();

      candidates.push(
        this.toNameCandidate(heading, h1Observation.id),
      );

      reasoning.push(
        `H1 observation contributed candidate "${heading}".`,
      );
    } else {
      reasoning.push("H1 observation absent — no heading-derived candidates added.");
    }

    return candidates;
  }

  /**
   * Creates a candidate with a normalized comparison key.
   *
   * Normalization is limited to trim and lowercase — no stemming, no fuzzy
   * matching, and no AI-based similarity.
   */
  private toNameCandidate(value: string, observationId: string): NameCandidate {
    return {
      value,
      normalized: value.trim().toLowerCase(),
      observationId,
    };
  }

  /**
   * Extracts the segment before the first `|` or `-` in a title string.
   *
   * Version 1 rule: only the earliest separator splits the title.
   * Returns an empty string when no separator is present.
   */
  private extractTitlePrefix(title: string): string {
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
   * Deduplicates candidate display values while preserving first-seen order.
   */
  private uniqueCandidateValues(candidates: NameCandidate[]): string[] {
    const seen = new Set<string>();
    const values: string[] = [];

    for (const candidate of candidates) {
      if (seen.has(candidate.normalized)) {
        continue;
      }

      seen.add(candidate.normalized);
      values.push(candidate.value);
    }

    return values;
  }

  /**
   * Resolves the primary brand only when multiple observations agree.
   *
   * Version 1 rule: count distinct observation IDs supporting each normalized
   * name. A primary brand is assigned only when at least two different
   * observations produce the same normalized candidate. Ties are broken by
   * choosing the candidate with the most supporting observations, then the
   * earliest first-seen display value for determinism.
   */
  private resolvePrimaryBrand(
    candidates: NameCandidate[],
    reasoning: string[],
  ): string {
    const support = new Map<
      string,
      { value: string; observationIds: Set<string> }
    >();

    for (const candidate of candidates) {
      const entry = support.get(candidate.normalized);

      if (entry) {
        entry.observationIds.add(candidate.observationId);
        continue;
      }

      support.set(candidate.normalized, {
        value: candidate.value,
        observationIds: new Set([candidate.observationId]),
      });
    }

    let best: { value: string; observationIds: Set<string> } | undefined;

    for (const entry of support.values()) {
      if (entry.observationIds.size < 2) {
        continue;
      }

      if (
        !best ||
        entry.observationIds.size > best.observationIds.size
      ) {
        best = entry;
      }
    }

    if (!best) {
      return "";
    }

    reasoning.push(
      `Primary brand resolved to "${best.value}" — supported by ${best.observationIds.size} independent observation(s): ${[...best.observationIds].join(", ")}.`,
    );

    return best.value;
  }
}
