import type { BusinessQuestion } from "@/src/questions/shared/types";
import type { Observation } from "@/src/types/observation";
import type { ResolvedIdentity } from "@/src/types/resolved-identity";

import { extractContentZones } from "@/src/content-zones";
import { buildWebsiteEvidence } from "@/src/evidence/EvidenceBuilder";

import type { QuestionAnalysis, QuestionEngineContext } from "./QuestionAnalysis";
import { mapAnalysisToBusinessQuestion } from "./QuestionMapper";

export function createEmptyResolvedIdentity(): ResolvedIdentity {
  return {
    primaryBrand: "",
    legalBusinessName: "",
    tradingName: "",
    domain: "",
    websiteTitle: "",
    candidateNames: [],
    operatingCountry: "",
    confidence: 0,
    evidence: [],
    reasoning: [],
  };
}

/**
 * Permanent contract for all Question Engines.
 *
 * Question-specific extraction lives in each engine module.
 * Shared reasoning lives under src/questions/shared/.
 */
export interface QuestionEngine {
  readonly id: string;
  analyze(context: QuestionEngineContext): QuestionAnalysis;
  buildDetails(
    analysis: QuestionAnalysis,
    context: QuestionEngineContext,
  ): string[];
}

export type BusinessQuestionEngine = (
  observations: Observation[],
  resolvedIdentity: ResolvedIdentity,
) => BusinessQuestion;

export function createQuestionEngineContext(
  observations: Observation[],
  resolvedIdentity: ResolvedIdentity,
): QuestionEngineContext {
  const contentZones = extractContentZones(observations);
  const websiteEvidence = buildWebsiteEvidence(contentZones);

  return {
    observations,
    contentZones,
    websiteEvidence,
    resolvedIdentity,
  };
}

export function runQuestionEngine(
  engine: QuestionEngine,
  observations: Observation[],
  resolvedIdentity: ResolvedIdentity,
): QuestionAnalysis {
  return engine.analyze(
    createQuestionEngineContext(observations, resolvedIdentity),
  );
}

export function adaptQuestionEngineToLegacy(
  engine: QuestionEngine,
): BusinessQuestionEngine {
  return (observations, resolvedIdentity) => {
    const context = createQuestionEngineContext(
      observations,
      resolvedIdentity,
    );
    const analysis = engine.analyze(context);

    return mapAnalysisToBusinessQuestion(analysis, (result) =>
      engine.buildDetails(result, context),
    );
  };
}
