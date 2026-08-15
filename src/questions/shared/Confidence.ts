import type { BusinessQuestionStatus } from "@/src/questions/shared/types";

import type { RankedCandidate } from "./Evidence";

export interface ConfidencePolicy {
  maxWeight: number;
  foundThreshold: number;
  minObservations: number;
}

export interface ConfidenceEvaluation<TCandidate extends RankedCandidate> {
  answer: string;
  confidence: number;
  status: BusinessQuestionStatus;
  winningCandidate: TCandidate | null;
  reasoning: string[];
}

export interface ConfidenceResolutionOptions<TCandidate extends RankedCandidate> {
  rankedCandidates: TCandidate[];
  policy: ConfidencePolicy;
  isResolved: (winner: TCandidate, confidence: number) => boolean;
  buildPartialAnswer: (input: {
    winner: TCandidate | null;
    hasPartialSignals: boolean;
  }) => string;
  hasPartialSignals: boolean;
  reasoningPrefix: string;
  emptyReason: string;
  candidateReason: (candidate: TCandidate) => string;
  resolvedReason: (winner: TCandidate, confidence: number) => string;
  unresolvedReason: (winner: TCandidate) => string;
}

/**
 * Computes a normalized confidence ratio from total evidence weight.
 */
export function calculateConfidenceRatio(
  totalWeight: number,
  maxWeight: number,
): number {
  if (maxWeight <= 0) {
    return 0;
  }

  return totalWeight / maxWeight;
}

/**
 * Resolves answer, confidence, and status from ranked weighted evidence.
 */
export function resolveWeightedConfidence<TCandidate extends RankedCandidate>(
  options: ConfidenceResolutionOptions<TCandidate>,
): ConfidenceEvaluation<TCandidate> {
  const reasoning: string[] = [options.reasoningPrefix];
  const { rankedCandidates, policy } = options;

  if (rankedCandidates.length === 0) {
    reasoning.push(options.emptyReason);

    return {
      answer: "",
      confidence: 0,
      status: "missing",
      winningCandidate: null,
      reasoning,
    };
  }

  for (const candidate of rankedCandidates) {
    reasoning.push(options.candidateReason(candidate));
  }

  const winner = rankedCandidates[0] ?? null;
  const confidence = winner
    ? calculateConfidenceRatio(winner.totalWeight, policy.maxWeight)
    : 0;

  if (winner && options.isResolved(winner, confidence)) {
    reasoning.push(options.resolvedReason(winner, confidence));

    return {
      answer: winner.displayValue,
      confidence,
      status: "found",
      winningCandidate: winner,
      reasoning,
    };
  }

  if (winner) {
    reasoning.push(options.unresolvedReason(winner));
  }

  const status: BusinessQuestionStatus = options.hasPartialSignals
    ? "partial"
    : "missing";

  return {
    answer: options.buildPartialAnswer({ winner, hasPartialSignals: options.hasPartialSignals }),
    confidence,
    status,
    winningCandidate: winner,
    reasoning,
  };
}

export function defaultIsResolved<TCandidate extends RankedCandidate>(
  winner: TCandidate,
  confidence: number,
  policy: ConfidencePolicy,
): boolean {
  return (
    confidence >= policy.foundThreshold &&
    winner.observationIds.length >= policy.minObservations
  );
}
