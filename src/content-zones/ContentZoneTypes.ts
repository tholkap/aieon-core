import type { Observation } from "@/src/types/observation";

export type ContentZoneType =
  | "navigation"
  | "hero"
  | "primary-message"
  | "supporting-message"
  | "products"
  | "services"
  | "features"
  | "benefits"
  | "trust"
  | "testimonials"
  | "cta"
  | "footer";

export interface ContentZone {
  id: string;
  type: ContentZoneType;
  observations: Observation[];
}
