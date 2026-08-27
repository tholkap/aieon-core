import type { BlindSpot } from "@/src/questions/shared/BlindSpot";
import type { Evidence, RankedCandidate } from "@/src/questions/shared/Evidence";
import type { Recommendation } from "@/src/questions/shared/Recommendation";
import type { BusinessQuestionStatus } from "@/src/questions/shared/types";

/** Deterministic evidence weights for primary offering sources (sum = 100). */
export const OFFERING_EVIDENCE_WEIGHTS = {
  "hero-main-headline": 35,
  "supporting-meta": 25,
  "hero-supporting-headline": 20,
  "supporting-section-heading": 15,
  cta: 10,
  "observation-h1": 35,
  "observation-meta": 25,
  "observation-h2": 20,
  "observation-h3": 15,
  "observation-cta": 10,
} as const;

export const MAX_OFFERING_EVIDENCE_WEIGHT = 100;

export const FOUND_OFFERING_CONFIDENCE_THRESHOLD = 0.35;

export const FOUND_OFFERING_MIN_OBSERVATIONS = 1;

export type OfferingCandidateSource = keyof typeof OFFERING_EVIDENCE_WEIGHTS;

export interface RawOfferingCandidate {
  value: string;
  normalized: string;
  sourceType: OfferingCandidateSource;
  observationId: string;
  selector: string;
  rawValue: string;
}

export interface NormalizedOfferingCandidateGroup {
  normalized: string;
  displayValue: string;
  members: RawOfferingCandidate[];
}

export type RankedOfferingCandidate = RankedCandidate<OfferingCandidateSource> & {
  evidence: Evidence[];
};

export interface OfferingCatalog {
  products: string[];
  services: string[];
  categories: string[];
}

export interface OfferingConfidenceResult {
  answer: string;
  confidence: number;
  status: BusinessQuestionStatus;
  winningCandidate: RankedOfferingCandidate | null;
  rankedCandidates: RankedOfferingCandidate[];
  primaryOffering: string;
  catalog: OfferingCatalog;
  reasoning: string[];
}

export interface OfferingUnderstanding {
  primaryOffering: string;
  products: string[];
  services: string[];
  categories: string[];
  confidence: number;
  evidence: Evidence[];
  blindSpots: BlindSpot[];
  recommendations: Recommendation[];
}
