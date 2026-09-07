import { selectEvidenceForResult } from "@/src/questions/shared/Evidence";
import type {
  QuestionAnalysis,
  QuestionEngineContext,
} from "@/src/questions/shared/QuestionAnalysis";
import type { QuestionEngine } from "@/src/questions/shared/QuestionEngine";
import { mapAnalysisToQuestionResult } from "@/src/questions/shared/QuestionMapper";
import type { QuestionResult } from "@/src/questions/shared/QuestionResult";

import { buildObservationZoneMap } from "../who-are-they/contentZoneMap";
import { analyzeOfferingBlindSpots } from "./BlindSpotAnalyzer";
import { calculateOfferingConfidence } from "./ConfidenceCalculator";
import {
  collectAlternateOfferings,
  rankOfferingCandidates,
} from "./EvidenceRanker";
import {
  buildOfferingCatalog,
  extractCorroboratedLabels,
  extractOfferingCandidates,
} from "./OfferingExtractor";
import { normalizeOfferingCandidates } from "./OfferingNormalizer";
import { generateOfferingRecommendations } from "./RecommendationGenerator";
import type { OfferingConfidenceResult, OfferingUnderstanding } from "./types";

interface OfferingPipelineResult {
  analysis: QuestionAnalysis;
  confidence: OfferingConfidenceResult;
  understanding: OfferingUnderstanding;
  alternateOfferings: string[];
}

function buildOfferingUnderstanding(
  analysis: QuestionAnalysis,
  confidence: OfferingConfidenceResult,
): OfferingUnderstanding {
  return {
    primaryOffering: confidence.primaryOffering,
    products: confidence.catalog.products,
    services: confidence.catalog.services,
    categories: confidence.catalog.categories,
    confidence: confidence.confidence,
    evidence: analysis.evidence,
    blindSpots: analysis.blindSpots,
    recommendations: analysis.recommendations,
  };
}

function runPipeline(context: QuestionEngineContext): OfferingPipelineResult {
  const input = {
    websiteEvidence: context.websiteEvidence,
    observations: context.observations,
  };
  const rawCandidates = extractOfferingCandidates(input);
  const groups = normalizeOfferingCandidates(rawCandidates);
  const observationZoneMap = buildObservationZoneMap(context.contentZones);
  const rankedCandidates = rankOfferingCandidates(groups, observationZoneMap);
  const catalog = buildOfferingCatalog(input);
  const confidence = calculateOfferingConfidence(
    rankedCandidates,
    groups,
    catalog,
  );
  const blindSpots = analyzeOfferingBlindSpots(confidence);
  const recommendations = generateOfferingRecommendations(blindSpots);
  const alternateOfferings = collectAlternateOfferings(
    rankedCandidates,
    confidence.winningCandidate,
  );

  const analysis: QuestionAnalysis = {
    questionId: "what",
    question: "What do they offer?",
    sectionTitle: "What you offer",
    answer: confidence.answer,
    confidence: confidence.confidence,
    status: confidence.status,
    evidence: [...selectEvidenceForResult(
      rankedCandidates,
      confidence.winningCandidate,
      confidence.status,
    ), ...extractCorroboratedLabels(input).flatMap((item) => item.observations.map((observation) => ({
      observationId: observation.id,
      sourceType: observation.sourceType,
      selector: observation.selector,
      rawValue: observation.rawValue,
      weight: 0,
    })))],
    reasoning: [...confidence.reasoning, "Descriptions are quoted from the page, not independently verified. Confidence is an internal rule-based support indicator, not a probability or AI visibility score."],
    blindSpots,
    recommendations,
  };

  const understanding = buildOfferingUnderstanding(analysis, confidence);

  return {
    analysis,
    confidence,
    understanding,
    alternateOfferings,
  };
}

function buildDetailsFromUnderstanding(
  understanding: OfferingUnderstanding,
  alternateOfferings: string[],
): string[] {
  const details: string[] = [];

  if (understanding.primaryOffering) {
    details.push(`Offering description found: ${understanding.primaryOffering}`);
  }

  if (understanding.products.length > 0) {
    details.push(`Products: ${understanding.products.join(", ")}`);
  }

  if (understanding.services.length > 0) {
    details.push(`Services: ${understanding.services.join(", ")}`);
  }

  if (understanding.categories.length > 0) {
    details.push(`Matching navigation and heading labels: ${understanding.categories.slice(0, 8).join(", ")}`);
  }

  if (alternateOfferings.length > 0) {
    details.push(`Other offering signals: ${alternateOfferings.join(", ")}`);
  }

  return details;
}

export class WhatDoTheyOfferQuestionEngine implements QuestionEngine {
  readonly id = "what";

  analyze(context: QuestionEngineContext): QuestionAnalysis {
    return runPipeline(context).analysis;
  }

  buildDetails(
    _analysis: QuestionAnalysis,
    context: QuestionEngineContext,
  ): string[] {
    const { understanding, alternateOfferings } = runPipeline(context);

    return buildDetailsFromUnderstanding(understanding, alternateOfferings);
  }
}

const whatDoTheyOfferQuestionEngine = new WhatDoTheyOfferQuestionEngine();

export function runWhatDoTheyOfferAnalysis(
  context: QuestionEngineContext,
): QuestionResult {
  return mapAnalysisToQuestionResult(
    whatDoTheyOfferQuestionEngine.analyze(context),
  );
}

export function runOfferingUnderstandingAnalysis(
  context: QuestionEngineContext,
): OfferingUnderstanding {
  return runPipeline(context).understanding;
}

export { whatDoTheyOfferQuestionEngine };
