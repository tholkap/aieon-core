import type { Evidence, RankedCandidate } from "@/src/questions/shared/Evidence";
import type { BusinessQuestionStatus } from "@/src/questions/shared/types";

/** Deterministic evidence weights for brand-name sources (sum = 100). */
export const EVIDENCE_WEIGHTS = {
  title: 30,
  h1: 35,
  "meta-description": 15,
  domain: 20,
} as const;

export const MAX_EVIDENCE_WEIGHT = 100;

/** Minimum weighted confidence required for a resolved brand answer. */
export const FOUND_CONFIDENCE_THRESHOLD = 0.65;

/** Minimum distinct observations required for a resolved brand answer. */
export const FOUND_MIN_OBSERVATIONS = 2;

export type BrandCandidateSource = keyof typeof EVIDENCE_WEIGHTS;

export interface RawBrandCandidate {
  value: string;
  normalized: string;
  sourceType: BrandCandidateSource;
  observationId: string;
  selector: string;
  rawValue: string;
}

export interface NormalizedBrandCandidateGroup {
  normalized: string;
  displayValue: string;
  members: RawBrandCandidate[];
}

export type RankedBrandCandidate = RankedCandidate<BrandCandidateSource> & {
  evidence: Evidence[];
};

export interface ConfidenceResult {
  answer: string;
  confidence: number;
  status: BusinessQuestionStatus;
  winningCandidate: RankedBrandCandidate | null;
  rankedCandidates: RankedBrandCandidate[];
  domain: string;
  websiteTitle: string;
  reasoning: string[];
}
