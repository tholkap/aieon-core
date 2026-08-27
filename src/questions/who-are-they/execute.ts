import {
  adaptQuestionEngineToLegacy,
  createEmptyResolvedIdentity,
  createQuestionEngineContext,
} from "@/src/questions/shared/QuestionEngine";
import type { QuestionResult } from "@/src/questions/shared/QuestionResult";
import type { Observation } from "@/src/types/observation";
import type { ResolvedIdentity } from "@/src/types/resolved-identity";

import {
  runWhoAreTheyAnalysis,
  whoAreTheyQuestionEngine,
} from "./WhoAreTheyQuestionEngine";

export const execute = adaptQuestionEngineToLegacy(whoAreTheyQuestionEngine);

/**
 * Runs the Who Are They? Question Engine from observations and content zones.
 */
export function runWhoAreTheyEngine(
  observations: Observation[],
  resolvedIdentity?: ResolvedIdentity,
): QuestionResult {
  return runWhoAreTheyAnalysis(
    createQuestionEngineContext(
      observations,
      resolvedIdentity ?? createEmptyResolvedIdentity(),
    ),
  );
}
