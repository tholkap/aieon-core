import {
  adaptQuestionEngineToLegacy,
  createEmptyResolvedIdentity,
  createQuestionEngineContext,
} from "@/src/questions/shared/QuestionEngine";
import type { QuestionResult } from "@/src/questions/shared/QuestionResult";
import type { Observation } from "@/src/types/observation";
import type { ResolvedIdentity } from "@/src/types/resolved-identity";

import type { OfferingUnderstanding } from "./types";
import {
  runOfferingUnderstandingAnalysis,
  runWhatDoTheyOfferAnalysis,
  whatDoTheyOfferQuestionEngine,
} from "./WhatDoTheyOfferQuestionEngine";

export const execute = adaptQuestionEngineToLegacy(whatDoTheyOfferQuestionEngine);

/**
 * Runs the What Do They Offer? Question Engine from observations.
 * Returns the legacy QuestionResult report shape.
 */
export function runWhatDoTheyOfferEngine(
  observations: Observation[],
  resolvedIdentity?: ResolvedIdentity,
): QuestionResult {
  return runWhatDoTheyOfferAnalysis(
    createQuestionEngineContext(
      observations,
      resolvedIdentity ?? createEmptyResolvedIdentity(),
    ),
  );
}

/**
 * Runs the Offering Understanding Engine from observations.
 * Returns structured offering knowledge from WebsiteEvidence.
 */
export function runOfferingUnderstandingEngine(
  observations: Observation[],
  resolvedIdentity?: ResolvedIdentity,
): OfferingUnderstanding {
  return runOfferingUnderstandingAnalysis(
    createQuestionEngineContext(
      observations,
      resolvedIdentity ?? createEmptyResolvedIdentity(),
    ),
  );
}
