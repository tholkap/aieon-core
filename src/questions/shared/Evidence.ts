import type { ContentZone } from "@/src/questions/shared/ContentZone";

export interface Evidence {
  observationId: string;
  sourceType: string;
  selector: string;
  rawValue: string;
  weight: number;
  contentZone?: ContentZone;
}

export interface EvidenceContributor {
  sourceType: string;
  observationId: string;
  selector: string;
  rawValue: string;
}

export interface NormalizedCandidateGroup<TMember extends EvidenceContributor> {
  normalized: string;
  displayValue: string;
  members: TMember[];
}

export interface RankedCandidate<TSourceType extends string = string> {
  normalized: string;
  displayValue: string;
  evidence: Evidence[];
  totalWeight: number;
  observationIds: string[];
  sourceTypes: TSourceType[];
}

/**
 * Removes duplicate evidence entries by source type and observation ID.
 */
export function dedupeEvidence(evidence: Evidence[]): Evidence[] {
  const seen = new Set<string>();
  const unique: Evidence[] = [];

  for (const item of evidence) {
    const key = `${item.sourceType}::${item.observationId}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(item);
  }

  return unique;
}

/**
 * Aggregates weighted evidence for a normalized candidate group.
 */
export function aggregateEvidence(
  members: EvidenceContributor[],
  getWeight: (sourceType: string) => number,
  contentZones?: Map<string, ContentZone>,
): Evidence[] {
  const evidenceByKey = new Map<string, Evidence>();

  for (const member of members) {
    const evidenceKey = `${member.sourceType}::${member.observationId}`;

    if (evidenceByKey.has(evidenceKey)) {
      continue;
    }

    evidenceByKey.set(evidenceKey, {
      observationId: member.observationId,
      sourceType: member.sourceType,
      selector: member.selector,
      rawValue: member.rawValue,
      weight: getWeight(member.sourceType),
      contentZone: contentZones?.get(member.observationId),
    });
  }

  return [...evidenceByKey.values()];
}

/**
 * Deterministic sort for ranked candidates: weight, observation count, label.
 */
export function compareRankedCandidates<
  TCandidate extends RankedCandidate,
>(left: TCandidate, right: TCandidate): number {
  if (right.totalWeight !== left.totalWeight) {
    return right.totalWeight - left.totalWeight;
  }

  if (right.observationIds.length !== left.observationIds.length) {
    return right.observationIds.length - left.observationIds.length;
  }

  return left.displayValue.localeCompare(right.displayValue);
}

export function rankCandidateGroups<
  TMember extends EvidenceContributor,
  TSourceType extends string,
>(
  groups: NormalizedCandidateGroup<TMember>[],
  getWeight: (sourceType: string) => number,
  contentZones?: Map<string, ContentZone>,
): RankedCandidate<TSourceType>[] {
  const ranked = groups.map((group) => {
    const evidence = aggregateEvidence(
      group.members,
      getWeight,
      contentZones,
    );
    const observationIds = [
      ...new Set(evidence.map((item) => item.observationId)),
    ];
    const sourceTypes = [
      ...new Set(
        evidence.map((item) => item.sourceType as TSourceType),
      ),
    ];
    const totalWeight = evidence.reduce((sum, item) => sum + item.weight, 0);

    return {
      normalized: group.normalized,
      displayValue: group.displayValue,
      evidence,
      totalWeight,
      observationIds,
      sourceTypes,
    };
  });

  return ranked.sort(compareRankedCandidates);
}

export function collectAlternateDisplayValues<
  TCandidate extends RankedCandidate,
>(
  rankedCandidates: TCandidate[],
  winningCandidate: TCandidate | null,
): string[] {
  const winnerNormalized = winningCandidate?.normalized;

  return rankedCandidates
    .filter((candidate) => candidate.normalized !== winnerNormalized)
    .map((candidate) => candidate.displayValue);
}

export function selectEvidenceForResult<
  TCandidate extends RankedCandidate,
>(
  rankedCandidates: TCandidate[],
  winningCandidate: TCandidate | null,
  status: "found" | "partial" | "missing",
): Evidence[] {
  if (status === "found" && winningCandidate) {
    return winningCandidate.evidence;
  }

  return dedupeEvidence(
    rankedCandidates.flatMap((candidate) => candidate.evidence),
  );
}
