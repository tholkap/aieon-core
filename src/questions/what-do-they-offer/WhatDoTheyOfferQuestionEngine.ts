import type {
  QuestionAnalysis,
  QuestionEngineContext,
} from "@/src/questions/shared/QuestionAnalysis";
import type { QuestionEngine } from "@/src/questions/shared/QuestionEngine";

/**
 * Question Engine 2 scaffold — implements the shared QuestionEngine contract.
 *
 * TODO Milestone 5: Extract offering candidates from hero and product-service
 * zones using observations classified by ContentZoneEngine.
 */
export class WhatDoTheyOfferQuestionEngine implements QuestionEngine {
  readonly id = "what";

  analyze(_context: QuestionEngineContext): QuestionAnalysis {
    throw new Error(
      "WhatDoTheyOfferQuestionEngine is not implemented yet.",
    );
  }

  buildDetails(
    _analysis: QuestionAnalysis,
    _context: QuestionEngineContext,
  ): string[] {
    throw new Error(
      "WhatDoTheyOfferQuestionEngine is not implemented yet.",
    );
  }
}
