import type {
  NormalizedBrandCandidateGroup,
  RawBrandCandidate,
} from "./types";

/**
 * Groups equivalent brand candidates by a deterministic normalized key.
 *
 * Normalization is trim + lowercase only — no stemming, fuzzy matching, or AI.
 */
export function normalizeCandidates(
  candidates: RawBrandCandidate[],
): NormalizedBrandCandidateGroup[] {
  const groups = new Map<string, NormalizedBrandCandidateGroup>();

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

export function uniqueDisplayValues(
  groups: NormalizedBrandCandidateGroup[],
): string[] {
  return groups.map((group) => group.displayValue);
}
