import type { NormalizedCandidateGroup } from "@/src/questions/shared/Evidence";
import {
  collectAlternateDisplayValues,
  rankCandidateGroups,
} from "@/src/questions/shared/Evidence";
import type { ContentZone as LegacyContentZone } from "@/src/questions/shared/ContentZone";

import { OFFERING_EVIDENCE_WEIGHTS } from "./types";
import type {
  NormalizedOfferingCandidateGroup,
  RankedOfferingCandidate,
  RawOfferingCandidate,
} from "./types";

function getEvidenceWeight(sourceType: string): number {
  return OFFERING_EVIDENCE_WEIGHTS[
    sourceType as keyof typeof OFFERING_EVIDENCE_WEIGHTS
  ] ?? 0;
}

export function rankOfferingCandidates(
  groups: NormalizedOfferingCandidateGroup[],
  contentZones?: Map<string, LegacyContentZone>,
): RankedOfferingCandidate[] {
  return rankCandidateGroups<
    RawOfferingCandidate,
    RankedOfferingCandidate["sourceTypes"][number]
  >(
    groups as NormalizedCandidateGroup<RawOfferingCandidate>[],
    getEvidenceWeight,
    contentZones,
  );
}

export { collectAlternateDisplayValues as collectAlternateOfferings };
