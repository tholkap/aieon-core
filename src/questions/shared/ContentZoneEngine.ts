import type { Observation, ObservationSourceType } from "@/src/types/observation";

import type { ContentZone, ContentZoneAssignment } from "./ContentZone";

interface ZoneRule {
  contentZone: ContentZone;
  reason: string;
}

/**
 * Deterministic structural zone rules keyed by observation source type.
 *
 * Assigns HTML origin only — never interprets business meaning.
 */
const SOURCE_TYPE_ZONE_RULES: Partial<
  Record<ObservationSourceType, ZoneRule>
> = {
  title: {
    contentZone: "hero",
    reason: 'sourceType "title" — document title is a primary page-level signal.',
  },
  "meta-description": {
    contentZone: "hero",
    reason:
      'sourceType "meta-description" — meta description accompanies primary page identity.',
  },
  h1: {
    contentZone: "hero",
    reason: 'sourceType "h1" — first heading is structurally the primary headline.',
  },
  h2: {
    contentZone: "main-content",
    reason: 'sourceType "h2" — section heading belongs to body content.',
  },
  h3: {
    contentZone: "main-content",
    reason: 'sourceType "h3" — subsection heading belongs to body content.',
  },
  "navigation-link": {
    contentZone: "navigation",
    reason: 'sourceType "navigation-link" — extracted from a nav anchor selector.',
  },
  "footer-link": {
    contentZone: "footer",
    reason: 'sourceType "footer-link" — extracted from a footer anchor selector.',
  },
  button: {
    contentZone: "cta",
    reason: 'sourceType "button" — button element is a call-to-action control.',
  },
  "list-item": {
    contentZone: "product-service",
    reason:
      'sourceType "list-item" — list items structurally enumerate itemized page content.',
  },
  "product-schema": {
    contentZone: "product-service",
    reason:
      'sourceType "product-schema" — product structured data block.',
  },
};

const UNKNOWN_ZONE_RULE: ZoneRule = {
  contentZone: "unknown",
  reason: "No structural content-zone rule is defined for this source type.",
};

/**
 * Classifies observations into structural page zones.
 *
 * Future Question Engines consume observations together with these assignments.
 */
export class ContentZoneEngine {
  classify(observations: Observation[]): ContentZoneAssignment[] {
    return observations.map((observation) =>
      this.classifyObservation(observation),
    );
  }

  classifyToMap(observations: Observation[]): Map<string, ContentZone> {
    return new Map(
      this.classify(observations).map((assignment) => [
        assignment.observationId,
        assignment.contentZone,
      ]),
    );
  }

  private classifyObservation(observation: Observation): ContentZoneAssignment {
    const rule =
      SOURCE_TYPE_ZONE_RULES[observation.sourceType] ?? UNKNOWN_ZONE_RULE;

    return {
      observationId: observation.id,
      contentZone: rule.contentZone,
      reason: rule.reason,
    };
  }
}

export function createContentZoneEngine(): ContentZoneEngine {
  return new ContentZoneEngine();
}
