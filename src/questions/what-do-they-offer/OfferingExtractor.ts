import type { WebsiteEvidence } from "@/src/evidence/EvidenceTypes";
import type { Observation } from "@/src/types/observation";
import { NON_OFFERING_NAVIGATION_LABELS } from "./constants";
import type { OfferingCatalog, RawOfferingCandidate } from "./types";

export interface ExtractOfferingInput {
  websiteEvidence: WebsiteEvidence;
  observations: Observation[];
}

const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

// Conservative English description rules, not a general semantic classifier.
// Answers stay verbatim: these terms never supply an inferred category.
const OFFERING_DESCRIPTION = /\b(software|platform|consulting|accounting|legal services|repair services|flower delivery|news|newspaper|news coverage|news updates|accommodation|hotel rooms|courses|training|manufactur(?:e|es|ing)|sell|sells|provide|provides|offer|offers|speciali[sz]e|speciali[sz]es|delivery|shipping)\b/i;
const NEGATED_DESCRIPTION = /\b(?:do not|does not|don't|doesn't|never|not)\s+(?:offer|provide|sell|manufacture|a\b|an\b)/i;

function isOfferingDescription(value: string): boolean {
  const words = value.trim().split(/\s+/);
  return words.length >= 4 && value.length <= 700 &&
    !/[<>]/.test(value) && !NEGATED_DESCRIPTION.test(value) &&
    OFFERING_DESCRIPTION.test(value);
}

/** Select descriptive copy, never a title, arbitrary heading, or CTA alone. */
export function extractOfferingCandidates({ observations }: ExtractOfferingInput): RawOfferingCandidate[] {
  return observations
    .filter((o) => (o.sourceType === "h1" || o.sourceType === "meta-description") && isOfferingDescription(o.rawValue))
    .map((o) => ({
      value: o.rawValue.trim(),
      normalized: normalize(o.rawValue),
      sourceType: o.sourceType === "h1" ? "observation-h1" : "observation-meta",
      observationId: o.id,
      selector: o.selector,
      rawValue: o.rawValue,
    }));
}

/**
 * Matching heading and navigation text is a named-offering clue, not proof
 * that every navigation label is a product. Preserve both actual sources.
 */
export function extractCorroboratedLabels({ observations }: ExtractOfferingInput) {
  const labels = new Map<string, { value: string; observations: Observation[] }>();
  const navigation = observations.filter((o) => o.sourceType === "navigation-link");
  for (const heading of observations) {
    if (heading.sourceType !== "h2" && heading.sourceType !== "h3") continue;
    const value = heading.rawValue.trim();
    const key = normalize(value);
    if (!key || value.length > 80 || /[<>]/.test(value) || NON_OFFERING_NAVIGATION_LABELS.has(key)) continue;
    const matches = navigation.filter((o) => normalize(o.rawValue) === key && o.id !== heading.id);
    if (matches.length && !labels.has(key)) labels.set(key, { value, observations: [heading, ...matches] });
  }
  return [...labels.values()];
}

/** Do not turn arbitrary list items into products or presume service coverage. */
export function buildOfferingCatalog(input: ExtractOfferingInput): OfferingCatalog {
  return { products: [], services: [], categories: extractCorroboratedLabels(input).map((item) => item.value) };
}
