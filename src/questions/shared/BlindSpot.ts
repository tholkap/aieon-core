import type { Observation, ObservationSourceType } from "@/src/types/observation";

export interface BlindSpot {
  id: string;
  title: string;
  description: string;
}

export interface BlindSpotCondition {
  id: string;
  title: string;
  description: string;
  detect: () => boolean;
}

/**
 * Returns true when a non-empty observation exists for the given source type.
 */
export function hasObservationSource(
  observations: Observation[],
  sourceType: ObservationSourceType,
): boolean {
  return observations.some(
    (observation) =>
      observation.sourceType === sourceType &&
      observation.rawValue.trim().length > 0,
  );
}

/**
 * Evaluates deterministic blind-spot conditions in declaration order.
 */
export function detectBlindSpots(conditions: BlindSpotCondition[]): BlindSpot[] {
  const blindSpots: BlindSpot[] = [];

  for (const condition of conditions) {
    if (condition.detect()) {
      blindSpots.push({
        id: condition.id,
        title: condition.title,
        description: condition.description,
      });
    }
  }

  return blindSpots;
}
