import type { NormalizedOfferingCandidateGroup, RawOfferingCandidate } from "./types";

/**
 * Groups equivalent offering candidates by a deterministic normalized key.
 */
export function normalizeOfferingCandidates(
  candidates: RawOfferingCandidate[],
): NormalizedOfferingCandidateGroup[] {
  const groups = new Map<string, NormalizedOfferingCandidateGroup>();

  for (const candidate of candidates) {
    const existing = groups.get(candidate.normalized);

    if (existing) {
      existing.members.push(candidate);
      continue;
    }

    groups.set(candidate.normalized, {
      normalized: candidate.normalized,
      displayValue: candidate.value,
      members: [candidate],
    });
  }

  return [...groups.values()];
}

export function uniqueOfferingDisplayValues(
  groups: NormalizedOfferingCandidateGroup[],
): string[] {
  return groups.map((group) => group.displayValue);
}
