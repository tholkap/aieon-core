import type { ContentZone } from "@/src/content-zones/ContentZoneTypes";
import type { ContentZone as LegacyContentZone } from "@/src/questions/shared/ContentZone";

const SEMANTIC_TO_LEGACY_ZONE: Partial<
  Record<ContentZone["type"], LegacyContentZone>
> = {
  navigation: "navigation",
  hero: "hero",
  "supporting-message": "main-content",
  cta: "cta",
  footer: "footer",
};

export function buildObservationZoneMap(
  contentZones: ContentZone[],
): Map<string, LegacyContentZone> {
  const map = new Map<string, LegacyContentZone>();

  for (const zone of contentZones) {
    const legacyZone = SEMANTIC_TO_LEGACY_ZONE[zone.type];

    if (!legacyZone) {
      continue;
    }

    for (const observation of zone.observations) {
      map.set(observation.id, legacyZone);
    }
  }

  return map;
}
