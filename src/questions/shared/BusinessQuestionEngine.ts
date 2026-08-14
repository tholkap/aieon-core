import type { BusinessQuestion } from "@/src/questions/shared/types";
import type { Observation } from "@/src/types/observation";
import type { ResolvedIdentity } from "@/src/types/resolved-identity";

/**
 * Shared contract for all Question Modules.
 *
 * TODO Sprint 5+: Move remaining question builders from mapBusinessProfile.ts
 * into their respective src/questions/* modules following this contract.
 */
export type BusinessQuestionEngine = (
  observations: Observation[],
  resolvedIdentity: ResolvedIdentity,
) => BusinessQuestion;
