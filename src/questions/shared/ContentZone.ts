/**
 * Structural page zones — location only, never business meaning.
 */
export type ContentZone =
  | "hero"
  | "navigation"
  | "main-content"
  | "product-service"
  | "cta"
  | "footer"
  | "unknown";

export interface ContentZoneAssignment {
  observationId: string;
  contentZone: ContentZone;
  /** Plain-language trace of the structural rule applied. */
  reason: string;
}

export interface ZonedObservation {
  observation: import("@/src/types/observation").Observation;
  contentZone: ContentZone;
}
