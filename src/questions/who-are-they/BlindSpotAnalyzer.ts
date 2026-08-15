import type { Observation } from "@/src/types/observation";

import {
  detectBlindSpots,
  hasObservationSource,
} from "@/src/questions/shared/BlindSpot";
import type { BlindSpot } from "@/src/questions/shared/BlindSpot";

import type { ConfidenceResult } from "./types";

/**
 * Identifies deterministic identity blind spots from evidence gaps.
 */
export function analyzeBlindSpots(
  observations: Observation[],
  confidence: ConfidenceResult,
): BlindSpot[] {
  return detectBlindSpots([
    {
      id: "missing-title",
      title: "Page title is missing",
      description:
        "AI cannot read a document title to learn how the business names itself.",
      detect: () => !hasObservationSource(observations, "title"),
    },
    {
      id: "missing-h1",
      title: "Main headline is missing",
      description:
        "Without a primary H1 heading, AI lacks a prominent on-page brand signal.",
      detect: () => !hasObservationSource(observations, "h1"),
    },
    {
      id: "missing-meta-description",
      title: "Meta description is missing",
      description:
        "A meta description provides an additional explicit public signal about the business.",
      detect: () => !hasObservationSource(observations, "meta-description"),
    },
    {
      id: "missing-domain",
      title: "Domain could not be derived",
      description:
        "No valid page URL was available to derive the website hostname.",
      detect: () => !confidence.domain,
    },
    {
      id: "conflicting-candidates",
      title: "Brand signals do not agree",
      description:
        "Multiple brand-name candidates were extracted, but weighted evidence did not converge on one answer.",
      detect: () =>
        confidence.status !== "found" &&
        confidence.rankedCandidates.length > 1,
    },
    {
      id: "domain-only",
      title: "Only domain evidence is available",
      description:
        "The hostname is known, but no on-page title, headline, or description confirms the brand name.",
      detect: () =>
        confidence.status === "partial" &&
        confidence.winningCandidate !== null &&
        confidence.winningCandidate.sourceTypes.every(
          (sourceType) => sourceType === "domain",
        ),
    },
    {
      id: "single-source",
      title: "Brand name relies on a single source",
      description:
        "AiEON requires at least two independent observations before confirming a primary brand.",
      detect: () =>
        confidence.status === "partial" &&
        confidence.winningCandidate !== null &&
        confidence.winningCandidate.observationIds.length < 2,
    },
  ]);
}
