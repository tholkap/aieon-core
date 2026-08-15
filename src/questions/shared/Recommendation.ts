import type { BlindSpot } from "./BlindSpot";

export type RecommendationPriority = "high" | "medium";

export interface Recommendation {
  id: string;
  priority: RecommendationPriority;
  title: string;
  description: string;
}

export type RecommendationCatalog = Record<string, Recommendation>;

/**
 * Maps blind spots to recommendations using a deterministic catalog.
 */
export function generateRecommendationsFromCatalog(
  blindSpots: BlindSpot[],
  catalog: RecommendationCatalog,
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const blindSpot of blindSpots) {
    const recommendation = catalog[blindSpot.id];

    if (recommendation) {
      recommendations.push(recommendation);
    }
  }

  return sortRecommendationsByPriority(recommendations);
}

export function sortRecommendationsByPriority(
  recommendations: Recommendation[],
): Recommendation[] {
  return [...recommendations].sort((left, right) => {
    if (left.priority === right.priority) {
      return 0;
    }

    return left.priority === "high" ? -1 : 1;
  });
}
