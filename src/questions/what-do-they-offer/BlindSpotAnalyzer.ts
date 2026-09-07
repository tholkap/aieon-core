import type { BlindSpot } from "@/src/questions/shared/BlindSpot";
import type { OfferingConfidenceResult } from "./types";

export function analyzeOfferingBlindSpots(confidence: OfferingConfidenceResult): BlindSpot[] {
  if (confidence.status === "found") return [];
  return [{
    id: "offering-description-check",
    title: "Review how your offering is described",
    description: confidence.primaryOffering
      ? "A description was identified, but the current rules did not establish a matching statement in a second checked source. Different wording is not evidence of a contradiction."
      : "AiEON did not identify a clear offering description in the checked headline and metadata. This may reflect extraction or language limitations, rather than missing content.",
  }];
}
