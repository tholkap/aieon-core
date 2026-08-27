import type { BlindSpot } from "@/src/questions/shared/BlindSpot";
import type { Recommendation } from "@/src/questions/shared/Recommendation";
import { generateRecommendationsFromCatalog } from "@/src/questions/shared/Recommendation";

const BLIND_SPOT_RECOMMENDATIONS = {
  "missing-main-headline": {
    id: "rec-missing-main-headline",
    priority: "high" as const,
    title: "State what you offer in your main headline",
    description:
      "Use your H1 to explain your core product or service in plain language a stranger would understand.",
  },
  "missing-meta-description": {
    id: "rec-missing-meta-description",
    priority: "medium" as const,
    title: "Add a supporting offering description",
    description:
      "Write a meta description that summarizes what you offer and who it helps.",
  },
  "missing-categories": {
    id: "rec-missing-categories",
    priority: "medium" as const,
    title: "Expose offering categories in navigation",
    description:
      "Use navigation labels to show how your products and services are organized.",
  },
  "missing-cta": {
    id: "rec-missing-cta",
    priority: "medium" as const,
    title: "Add a clear call to action",
    description:
      "Use a prominent button that states what visitors can do next — buy, book, get a demo, or contact you.",
  },
  "missing-products": {
    id: "rec-missing-products",
    priority: "medium" as const,
    title: "Name your products explicitly",
    description:
      "List product names on your homepage or in structured product content AI can read.",
  },
  "missing-services": {
    id: "rec-missing-services",
    priority: "medium" as const,
    title: "Name your services explicitly",
    description:
      "State the services you provide in dedicated sections or structured content on your public site.",
  },
  "conflicting-offerings": {
    id: "rec-conflicting-offerings",
    priority: "high" as const,
    title: "Align your offering message",
    description:
      "Make your headline, meta description, and supporting copy describe the same primary offering.",
  },
  "categories-only": {
    id: "rec-categories-only",
    priority: "high" as const,
    title: "Add a clear primary offering statement",
    description:
      "Do not rely on navigation alone — explain what you offer in your hero headline and description.",
  },
};

export function generateOfferingRecommendations(
  blindSpots: BlindSpot[],
): Recommendation[] {
  return generateRecommendationsFromCatalog(
    blindSpots,
    BLIND_SPOT_RECOMMENDATIONS,
  );
}
