import type { Observation } from "@/src/types/observation";

import { resolveWeightedConfidence } from "@/src/questions/shared/Confidence";

import {
  extractDomainFromObservations,
  extractWebsiteTitle,
} from "./CandidateExtractor";
import { uniqueDisplayValues } from "./CandidateNormalizer";
import type { NormalizedBrandCandidateGroup } from "./types";
import {
  FOUND_CONFIDENCE_THRESHOLD,
  FOUND_MIN_OBSERVATIONS,
  MAX_EVIDENCE_WEIGHT,
} from "./types";
import type { ConfidenceResult, RankedBrandCandidate } from "./types";

function buildPartialAnswer(
  domain: string,
  pageContentCandidates: string[],
): string {
  if (pageContentCandidates.length > 0) {
    return "Your site mentions several possible brand names, but they do not yet agree strongly enough to confirm one primary identity.";
  }

  if (domain) {
    return `We could identify the website domain (${domain}) but no clear brand name from page content.`;
  }

  return "Not found on your website";
}

/**
 * Computes confidence from aggregated evidence weights and selects an answer.
 */
export function calculateConfidence(
  rankedCandidates: RankedBrandCandidate[],
  groups: NormalizedBrandCandidateGroup[],
  observations: Observation[],
): ConfidenceResult {
  const domain = extractDomainFromObservations(observations);
  const websiteTitle = extractWebsiteTitle(observations);
  const pageContentGroups = groups.filter((group) =>
    group.members.some((member) => member.sourceType !== "domain"),
  );
  const pageContentCandidates = uniqueDisplayValues(pageContentGroups);
  const hasPartialSignals =
    rankedCandidates.length > 0 ||
    Boolean(domain) ||
    pageContentCandidates.length > 0;

  const evaluation = resolveWeightedConfidence<RankedBrandCandidate>({
    rankedCandidates,
    policy: {
      maxWeight: MAX_EVIDENCE_WEIGHT,
      foundThreshold: FOUND_CONFIDENCE_THRESHOLD,
      minObservations: FOUND_MIN_OBSERVATIONS,
    },
    isResolved: (winner, confidence) =>
      confidence >= FOUND_CONFIDENCE_THRESHOLD &&
      winner.observationIds.length >= FOUND_MIN_OBSERVATIONS &&
      winner.sourceTypes.some((sourceType) => sourceType !== "domain"),
    buildPartialAnswer: () =>
      buildPartialAnswer(domain, pageContentCandidates),
    hasPartialSignals,
    reasoningPrefix:
      "Evaluated observations using deterministic evidence weights — no AI, no fuzzy matching.",
    emptyReason:
      "No brand-name candidates extracted from title, H1, meta description, or domain.",
    candidateReason: (candidate) =>
      `Candidate "${candidate.displayValue}" — total weight ${candidate.totalWeight}/${MAX_EVIDENCE_WEIGHT} from ${candidate.observationIds.length} observation(s): ${candidate.evidence.map((item) => `${item.sourceType} (${item.weight})`).join(", ")}.`,
    resolvedReason: (winner, confidence) =>
      `Answer resolved to "${winner.displayValue}" — confidence ${confidence.toFixed(2)} meets threshold ${FOUND_CONFIDENCE_THRESHOLD} with ${winner.observationIds.length} supporting observation(s).`,
    unresolvedReason: (winner) =>
      `No resolved answer — top candidate "${winner.displayValue}" did not meet confidence threshold ${FOUND_CONFIDENCE_THRESHOLD} and ${FOUND_MIN_OBSERVATIONS}-observation requirement together with non-domain page content.`,
  });

  return {
    answer: evaluation.answer,
    confidence: evaluation.confidence,
    status: evaluation.status,
    winningCandidate: evaluation.winningCandidate,
    rankedCandidates,
    domain,
    websiteTitle,
    reasoning: evaluation.reasoning,
  };
}
