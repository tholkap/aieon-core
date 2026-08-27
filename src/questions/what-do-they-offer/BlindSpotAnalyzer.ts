import type { Observation } from "@/src/types/observation";

import {
  detectBlindSpots,
  hasObservationSource,
} from "@/src/questions/shared/BlindSpot";
import type { BlindSpot } from "@/src/questions/shared/BlindSpot";
import type { WebsiteEvidence } from "@/src/evidence/EvidenceTypes";

import type { OfferingConfidenceResult } from "./types";

/**
 * Identifies deterministic offering blind spots from evidence gaps.
 */
export function analyzeOfferingBlindSpots(
  websiteEvidence: WebsiteEvidence,
  observations: Observation[],
  confidence: OfferingConfidenceResult,
): BlindSpot[] {
  return detectBlindSpots([
    {
      id: "missing-main-headline",
      title: "Primary offering headline is missing",
      description:
        "Without a main H1 headline, AI cannot identify what the business offers from its hero content.",
      detect: () =>
        !websiteEvidence.hero?.mainHeadline &&
        !hasObservationSource(observations, "h1"),
    },
    {
      id: "missing-meta-description",
      title: "Supporting offering description is missing",
      description:
        "A meta description helps AI understand what the business offers when the main headline is absent or unclear.",
      detect: () =>
        !websiteEvidence.supportingMessage?.metaDescription &&
        !hasObservationSource(observations, "meta-description"),
    },
    {
      id: "missing-categories",
      title: "Offering categories are not visible",
      description:
        "Navigation categories help AI understand how the business organizes its products and services.",
      detect: () => confidence.catalog.categories.length === 0,
    },
    {
      id: "missing-cta",
      title: "Primary call to action is missing",
      description:
        "A visible CTA helps AI connect what the business offers with the action visitors should take next.",
      detect: () =>
        !websiteEvidence.hero?.primaryCallToAction &&
        !websiteEvidence.cta?.callToActions.length &&
        !hasObservationSource(observations, "button"),
    },
    {
      id: "missing-products",
      title: "No products were identified",
      description:
        "Explicit product names or list items were not found in the available evidence.",
      detect: () => confidence.catalog.products.length === 0,
    },
    {
      id: "missing-services",
      title: "No services were identified",
      description:
        "Explicit service offerings were not found in the available evidence.",
      detect: () => confidence.catalog.services.length === 0,
    },
    {
      id: "conflicting-offerings",
      title: "Offering signals do not agree",
      description:
        "Multiple offering candidates were extracted, but weighted evidence did not converge on one primary offering.",
      detect: () =>
        confidence.status !== "found" &&
        confidence.rankedCandidates.length > 1,
    },
    {
      id: "categories-only",
      title: "Only navigation categories are available",
      description:
        "The site exposes category links, but no clear primary offering statement was found in hero or supporting content.",
      detect: () =>
        confidence.status === "partial" &&
        confidence.catalog.categories.length > 0 &&
        !confidence.primaryOffering,
    },
  ]);
}
