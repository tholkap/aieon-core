import { selectEvidenceForResult } from "@/src/questions/shared/Evidence";
import type {
  QuestionAnalysis,
  QuestionEngineContext,
} from "@/src/questions/shared/QuestionAnalysis";
import type { QuestionEngine } from "@/src/questions/shared/QuestionEngine";
import { mapAnalysisToQuestionResult } from "@/src/questions/shared/QuestionMapper";
import type { QuestionResult } from "@/src/questions/shared/QuestionResult";

import { analyzeBlindSpots } from "./BlindSpotAnalyzer";
import { extractCandidates } from "./CandidateExtractor";
import { normalizeCandidates } from "./CandidateNormalizer";
import { calculateConfidence } from "./ConfidenceCalculator";
import { collectAlternateCandidates, rankCandidates } from "./EvidenceRanker";
import { generateRecommendations } from "./RecommendationGenerator";
import type { ConfidenceResult } from "./types";

interface WhoAreTheyPipelineResult {
  analysis: QuestionAnalysis;
  confidence: ConfidenceResult;
  alternateCandidates: string[];
}

function runPipeline(context: QuestionEngineContext): WhoAreTheyPipelineResult {
  const rawCandidates = extractCandidates(context.observations);
  const groups = normalizeCandidates(rawCandidates);
  const rankedCandidates = rankCandidates(groups, context.contentZones);
  const confidence = calculateConfidence(
    rankedCandidates,
    groups,
    context.observations,
  );
  const blindSpots = analyzeBlindSpots(context.observations, confidence);
  const recommendations = generateRecommendations(blindSpots);
  const alternateCandidates = collectAlternateCandidates(
    rankedCandidates,
    confidence.winningCandidate,
  );

  const analysis: QuestionAnalysis = {
    questionId: "who",
    question: "Who are they?",
    sectionTitle: "Who you are",
    answer: confidence.answer,
    confidence: confidence.confidence,
    status: confidence.status,
    evidence: selectEvidenceForResult(
      rankedCandidates,
      confidence.winningCandidate,
      confidence.status,
    ),
    reasoning: confidence.reasoning,
    blindSpots,
    recommendations,
  };

  return {
    analysis,
    confidence,
    alternateCandidates,
  };
}

function buildDetailsFromConfidence(
  confidence: ConfidenceResult,
  alternateCandidates: string[],
  context: QuestionEngineContext,
): string[] {
  const details: string[] = [];

  if (confidence.status === "found" && confidence.answer) {
    details.push(`Primary brand: ${confidence.answer}`);
  }

  if (context.resolvedIdentity.legalBusinessName) {
    details.push(`Legal name: ${context.resolvedIdentity.legalBusinessName}`);
  }

  if (confidence.domain) {
    details.push(`Website: ${confidence.domain}`);
  }

  if (confidence.websiteTitle) {
    details.push(`Page title: ${confidence.websiteTitle}`);
  }

  if (alternateCandidates.length > 0) {
    details.push(`Other names found: ${alternateCandidates.join(", ")}`);
  }

  return details;
}

export class WhoAreTheyQuestionEngine implements QuestionEngine {
  readonly id = "who";

  analyze(context: QuestionEngineContext): QuestionAnalysis {
    return runPipeline(context).analysis;
  }

  buildDetails(
    _analysis: QuestionAnalysis,
    context: QuestionEngineContext,
  ): string[] {
    const { confidence, alternateCandidates } = runPipeline(context);

    return buildDetailsFromConfidence(
      confidence,
      alternateCandidates,
      context,
    );
  }
}

const whoAreTheyQuestionEngine = new WhoAreTheyQuestionEngine();

export function runWhoAreTheyAnalysis(
  context: QuestionEngineContext,
): QuestionResult {
  return mapAnalysisToQuestionResult(
    whoAreTheyQuestionEngine.analyze(context),
  );
}

export { whoAreTheyQuestionEngine };
