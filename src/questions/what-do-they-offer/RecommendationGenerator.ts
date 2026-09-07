import type { BlindSpot } from "@/src/questions/shared/BlindSpot";
import type { Recommendation } from "@/src/questions/shared/Recommendation";

export function generateOfferingRecommendations(blindSpots: BlindSpot[]): Recommendation[] {
  return blindSpots.map((spot) => ({
    id: `rec-${spot.id}`,
    priority: "medium",
    title: "Check your offering description",
    description: "Review the quoted evidence before changing your site. If a plain-language product or service description is absent, add one to your homepage and metadata, then rescan to check whether AiEON identifies it.",
  }));
}
