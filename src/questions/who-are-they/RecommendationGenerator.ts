import type { BlindSpot } from "@/src/questions/shared/BlindSpot";
import type { Recommendation } from "@/src/questions/shared/Recommendation";
import { generateRecommendationsFromCatalog } from "@/src/questions/shared/Recommendation";

const BLIND_SPOT_RECOMMENDATIONS = {
  "missing-title": {
    id: "rec-missing-title",
    priority: "high" as const,
    title: "Add a clear page title",
    description:
      "Set an HTML title that states your business name exactly as customers should recognize it.",
  },
  "missing-h1": {
    id: "rec-missing-h1",
    priority: "high" as const,
    title: "Add a primary H1 headline",
    description:
      "Place your business or brand name in the main H1 heading on your homepage.",
  },
  "missing-meta-description": {
    id: "rec-missing-meta-description",
    priority: "medium" as const,
    title: "Add a meta description",
    description:
      "Write a meta description that includes your business name and what you do in plain language.",
  },
  "conflicting-candidates": {
    id: "rec-conflicting-candidates",
    priority: "high" as const,
    title: "Use one consistent brand name",
    description:
      "Align your page title, main headline, and meta description so they refer to the same business name.",
  },
  "domain-only": {
    id: "rec-domain-only",
    priority: "high" as const,
    title: "State your brand name on the page",
    description:
      "Do not rely on the domain alone — make the business name visible in the title and main headline.",
  },
  "single-source": {
    id: "rec-single-source",
    priority: "high" as const,
    title: "Confirm your name in a second place",
    description:
      "Repeat the same brand name in at least one additional on-page location such as the title and H1.",
  },
};

/**
 * Maps deterministic blind spots to actionable recommendations.
 */
export function generateRecommendations(
  blindSpots: BlindSpot[],
): Recommendation[] {
  return generateRecommendationsFromCatalog(
    blindSpots,
    BLIND_SPOT_RECOMMENDATIONS,
  );
}
