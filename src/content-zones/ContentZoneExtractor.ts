import type { Observation, ObservationSourceType } from "@/src/types/observation";

import type { ContentZone, ContentZoneType } from "./ContentZoneTypes";

/**
 * Version 1 mapping from observation source type to content zone.
 *
 * Extend this table to assign additional source types in future versions.
 */
const SOURCE_TYPE_TO_ZONE: Partial<
  Record<ObservationSourceType, ContentZoneType>
> = {
  "navigation-link": "navigation",
  title: "hero",
  h1: "hero",
  h2: "hero",
  "meta-description": "supporting-message",
  h3: "supporting-message",
  button: "cta",
  "footer-link": "footer",
};

/** Fixed output order for deterministic zone grouping. */
const ZONE_OUTPUT_ORDER: ContentZoneType[] = [
  "navigation",
  "hero",
  "supporting-message",
  "cta",
  "footer",
];

/**
 * Groups observations into deterministic content zones using source type only.
 */
export function extractContentZones(
  observations: Observation[],
): ContentZone[] {
  const grouped = new Map<ContentZoneType, Observation[]>();

  for (const observation of observations) {
    const zoneType = SOURCE_TYPE_TO_ZONE[observation.sourceType];

    if (!zoneType) {
      continue;
    }

    const bucket = grouped.get(zoneType);

    if (bucket) {
      bucket.push(observation);
      continue;
    }

    grouped.set(zoneType, [observation]);
  }

  const zones: ContentZone[] = [];

  for (const zoneType of ZONE_OUTPUT_ORDER) {
    const zoneObservations = grouped.get(zoneType);

    if (!zoneObservations || zoneObservations.length === 0) {
      continue;
    }

    zones.push({
      id: zoneType,
      type: zoneType,
      observations: zoneObservations,
    });
  }

  return zones;
}
