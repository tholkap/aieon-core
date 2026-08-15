import type { BusinessQuestion } from "@/src/questions/shared/types";

import type { QuestionAnalysis } from "./QuestionAnalysis";

export interface BusinessQuestionDetailsBuilder {
  (analysis: QuestionAnalysis): string[];
}

/**
 * Maps a QuestionAnalysis to the legacy BusinessQuestion UI contract.
 */
export function mapAnalysisToBusinessQuestion(
  analysis: QuestionAnalysis,
  buildDetails: BusinessQuestionDetailsBuilder,
): BusinessQuestion {
  return {
    id: analysis.questionId,
    question: analysis.question,
    sectionTitle: analysis.sectionTitle,
    summary: analysis.answer,
    details: buildDetails(analysis),
    status: analysis.status,
    howDetermined:
      analysis.reasoning.length > 0 ? analysis.reasoning : undefined,
  };
}

/**
 * Maps a QuestionAnalysis to the legacy QuestionResult shape used by reports.
 */
export function mapAnalysisToQuestionResult(analysis: QuestionAnalysis) {
  return {
    questionId: analysis.questionId,
    question: analysis.question,
    sectionTitle: analysis.sectionTitle,
    answer: analysis.answer,
    confidence: analysis.confidence,
    status: analysis.status,
    evidence: analysis.evidence,
    reasoning: analysis.reasoning,
    blindSpots: analysis.blindSpots,
    recommendations: analysis.recommendations,
  };
}
