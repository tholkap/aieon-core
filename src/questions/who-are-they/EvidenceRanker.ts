import type { NormalizedCandidateGroup } from "@/src/questions/shared/Evidence";
import {
  collectAlternateDisplayValues,
  rankCandidateGroups,
} from "@/src/questions/shared/Evidence";
import type { ContentZone } from "@/src/questions/shared/ContentZone";

import { EVIDENCE_WEIGHTS } from "./types";
import type {
  NormalizedBrandCandidateGroup,
  RankedBrandCandidate,
  RawBrandCandidate,
} from "./types";

function getEvidenceWeight(sourceType: string): number {
  return EVIDENCE_WEIGHTS[sourceType as keyof typeof EVIDENCE_WEIGHTS] ?? 0;
}

/**
 * Aggregates weighted evidence for each normalized candidate group.
 */
export function rankCandidates(
  groups: NormalizedBrandCandidateGroup[],
  contentZones?: Map<string, ContentZone>,
): RankedBrandCandidate[] {
  return rankCandidateGroups<RawBrandCandidate, RankedBrandCandidate["sourceTypes"][number]>(
    groups as NormalizedCandidateGroup<RawBrandCandidate>[],
    getEvidenceWeight,
    contentZones,
  );
}

export { collectAlternateDisplayValues as collectAlternateCandidates };
