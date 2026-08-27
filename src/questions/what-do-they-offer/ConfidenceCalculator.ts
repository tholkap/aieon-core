import { resolveWeightedConfidence } from "@/src/questions/shared/Confidence";

import { uniqueOfferingDisplayValues } from "./OfferingNormalizer";
import type { NormalizedOfferingCandidateGroup, OfferingCatalog } from "./types";
import {
  FOUND_OFFERING_CONFIDENCE_THRESHOLD,
  FOUND_OFFERING_MIN_OBSERVATIONS,
  MAX_OFFERING_EVIDENCE_WEIGHT,
} from "./types";
import type { OfferingConfidenceResult, RankedOfferingCandidate } from "./types";

const PRIMARY_SOURCE_TYPES = new Set<RankedOfferingCandidate["sourceTypes"][number]>([
  "hero-main-headline",
  "observation-h1",
]);

function buildPartialAnswer(
  catalog: OfferingCatalog,
  pageContentCandidates: string[],
): string {
  if (pageContentCandidates.length > 0) {
    return pageContentCandidates[0] ?? "Not found on your website";
  }

  if (catalog.categories.length > 0) {
    return "Navigation categories were found, but no clear primary offering statement was identified.";
  }

  return "Not found on your website";
}

function resolvePrimaryOffering(
  winningCandidate: RankedOfferingCandidate | null,
  rankedCandidates: RankedOfferingCandidate[],
): string {
  if (winningCandidate) {
    return winningCandidate.displayValue;
  }

  return rankedCandidates[0]?.displayValue ?? "";
}

/**
 * Computes offering confidence and selects the primary offering answer.
 */
export function calculateOfferingConfidence(
  rankedCandidates: RankedOfferingCandidate[],
  groups: NormalizedOfferingCandidateGroup[],
  catalog: OfferingCatalog,
): OfferingConfidenceResult {
  const pageContentGroups = groups.filter((group) =>
    group.members.some((member) => member.sourceType !== "cta"),
  );
  const pageContentCandidates = uniqueOfferingDisplayValues(pageContentGroups);
  const hasPartialSignals =
    rankedCandidates.length > 0 || catalog.categories.length > 0;

  const evaluation = resolveWeightedConfidence<RankedOfferingCandidate>({
    rankedCandidates,
    policy: {
      maxWeight: MAX_OFFERING_EVIDENCE_WEIGHT,
      foundThreshold: FOUND_OFFERING_CONFIDENCE_THRESHOLD,
      minObservations: FOUND_OFFERING_MIN_OBSERVATIONS,
    },
    isResolved: (winner, confidence) =>
      confidence >= FOUND_OFFERING_CONFIDENCE_THRESHOLD &&
      winner.observationIds.length >= FOUND_OFFERING_MIN_OBSERVATIONS &&
      winner.sourceTypes.some((sourceType) =>
        PRIMARY_SOURCE_TYPES.has(sourceType),
      ),
    buildPartialAnswer: () =>
      buildPartialAnswer(catalog, pageContentCandidates),
    hasPartialSignals,
    reasoningPrefix:
      "Evaluated website evidence for offering understanding using deterministic evidence weights — no AI, no fuzzy matching.",
    emptyReason:
      "No primary offering candidates extracted from hero, supporting message, CTA, or observation fallbacks.",
    candidateReason: (candidate) =>
      `Offering candidate "${candidate.displayValue}" — total weight ${candidate.totalWeight}/${MAX_OFFERING_EVIDENCE_WEIGHT} from ${candidate.observationIds.length} source(s): ${candidate.evidence.map((item) => `${item.sourceType} (${item.weight})`).join(", ")}.`,
    resolvedReason: (winner, confidence) =>
      `Primary offering resolved to "${winner.displayValue}" — confidence ${confidence.toFixed(2)} meets threshold ${FOUND_OFFERING_CONFIDENCE_THRESHOLD}.`,
    unresolvedReason: (winner) =>
      `No resolved primary offering — top candidate "${winner.displayValue}" did not meet the main-headline evidence requirement.`,
  });

  const winningCandidate = evaluation.winningCandidate;
  const primaryOffering = resolvePrimaryOffering(
    winningCandidate,
    rankedCandidates,
  );

  return {
    answer: evaluation.answer,
    confidence: evaluation.confidence,
    status: evaluation.status,
    winningCandidate,
    rankedCandidates,
    primaryOffering,
    catalog,
    reasoning: evaluation.reasoning,
  };
}
