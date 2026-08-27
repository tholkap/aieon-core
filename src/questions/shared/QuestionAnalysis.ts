import type { ContentZone } from "@/src/content-zones/ContentZoneTypes";
import type { WebsiteEvidence } from "@/src/evidence/EvidenceTypes";
import type { BusinessQuestionStatus } from "@/src/questions/shared/types";
import type { Observation } from "@/src/types/observation";
import type { ResolvedIdentity } from "@/src/types/resolved-identity";

import type { BlindSpot } from "./BlindSpot";
import type { Evidence } from "./Evidence";
import type { Recommendation } from "./Recommendation";

/**
 * Canonical output of a Question Engine analysis pass.
 */
export interface QuestionAnalysis {
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

export interface QuestionEngineContext {
  observations: Observation[];
  contentZones: ContentZone[];
  websiteEvidence: WebsiteEvidence;
  resolvedIdentity: ResolvedIdentity;
}
