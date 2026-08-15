import type { BusinessQuestionStatus } from "@/src/questions/shared/types";

import type { BlindSpot } from "./BlindSpot";
import type { Evidence } from "./Evidence";
import type { Recommendation } from "./Recommendation";

/** @deprecated Use Evidence from ./Evidence.ts */
export type QuestionEvidence = Evidence;

/** @deprecated Use BlindSpot from ./BlindSpot.ts */
export type QuestionBlindSpot = BlindSpot;

/** @deprecated Use Recommendation from ./Recommendation.ts */
export type QuestionRecommendation = Recommendation;

/**
 * Legacy report shape — prefer QuestionAnalysis for new engines.
 */
export interface QuestionResult {
  questionId: string;
  question: string;
  sectionTitle: string;
  answer: string;
  confidence: number;
  status: BusinessQuestionStatus;
  evidence: Evidence[];
  reasoning: string[];
  blindSpots: BlindSpot[];
  recommendations: Recommendation[];
}

export type { QuestionAnalysis } from "./QuestionAnalysis";
