import type { WebsiteEvidence } from "@/src/evidence/EvidenceTypes";
import type { Observation } from "@/src/types/observation";

import { NON_OFFERING_NAVIGATION_LABELS } from "./constants";
import type { OfferingCatalog, RawOfferingCandidate } from "./types";

const EVIDENCE_OBSERVATION_PREFIX = "website-evidence::";

export interface ExtractOfferingInput {
  websiteEvidence: WebsiteEvidence;
  observations: Observation[];
}

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

function findObservation(
  observations: Observation[],
  sourceType: Observation["sourceType"],
): Observation | undefined {
  return observations.find((observation) => observation.sourceType === sourceType);
}

function appendCandidate(
  candidates: RawOfferingCandidate[],
  value: string,
  sourceType: RawOfferingCandidate["sourceType"],
  observationId: string,
  selector: string,
  rawValue: string,
): void {
  const trimmed = value.trim();

  if (!trimmed) {
    return;
  }

  candidates.push({
    value: trimmed,
    normalized: normalizeValue(trimmed),
    sourceType,
    observationId,
    selector,
    rawValue,
  });
}

function appendEvidenceCandidate(
  candidates: RawOfferingCandidate[],
  value: string | undefined,
  sourceType: RawOfferingCandidate["sourceType"],
  evidencePath: string,
): void {
  if (!value) {
    return;
  }

  appendCandidate(
    candidates,
    value,
    sourceType,
    `${EVIDENCE_OBSERVATION_PREFIX}${evidencePath}`,
    evidencePath,
    value,
  );
}

function appendObservationCandidate(
  candidates: RawOfferingCandidate[],
  observation: Observation | undefined,
  sourceType: RawOfferingCandidate["sourceType"],
): void {
  if (!observation?.rawValue.trim()) {
    return;
  }

  appendCandidate(
    candidates,
    observation.rawValue,
    sourceType,
    observation.id,
    observation.selector,
    observation.rawValue,
  );
}

function hasEvidenceCandidate(
  candidates: RawOfferingCandidate[],
  sourceType: RawOfferingCandidate["sourceType"],
): boolean {
  return candidates.some((candidate) => candidate.sourceType === sourceType);
}

function uniqueValues(values: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const normalized = normalizeValue(value);

    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    unique.push(value.trim());
  }

  return unique;
}

function observationValuesInOrder(
  observations: Observation[],
  sourceType: Observation["sourceType"],
): string[] {
  return observations
    .filter((observation) => observation.sourceType === sourceType)
    .map((observation) => observation.rawValue.trim())
    .filter((value) => value.length > 0);
}

/**
 * Extracts primary offering candidates from website evidence first,
 * then observation fallbacks for missing fields.
 */
export function extractOfferingCandidates({
  websiteEvidence,
  observations,
}: ExtractOfferingInput): RawOfferingCandidate[] {
  const candidates: RawOfferingCandidate[] = [];
  const hero = websiteEvidence.hero;
  const supportingMessage = websiteEvidence.supportingMessage;
  const cta = websiteEvidence.cta;

  appendEvidenceCandidate(
    candidates,
    hero?.mainHeadline,
    "hero-main-headline",
    "hero.mainHeadline",
  );
  appendEvidenceCandidate(
    candidates,
    supportingMessage?.metaDescription,
    "supporting-meta",
    "supportingMessage.metaDescription",
  );
  appendEvidenceCandidate(
    candidates,
    hero?.supportingHeadline,
    "hero-supporting-headline",
    "hero.supportingHeadline",
  );
  appendEvidenceCandidate(
    candidates,
    supportingMessage?.sectionHeadings[0],
    "supporting-section-heading",
    "supportingMessage.sectionHeadings[0]",
  );

  const primaryCta = hero?.primaryCallToAction ?? cta?.callToActions[0];
  const ctaEvidencePath = hero?.primaryCallToAction
    ? "hero.primaryCallToAction"
    : "cta.callToActions[0]";

  appendEvidenceCandidate(candidates, primaryCta, "cta", ctaEvidencePath);

  if (!hasEvidenceCandidate(candidates, "hero-main-headline")) {
    appendObservationCandidate(
      candidates,
      findObservation(observations, "h1"),
      "observation-h1",
    );
  }

  if (!hasEvidenceCandidate(candidates, "supporting-meta")) {
    appendObservationCandidate(
      candidates,
      findObservation(observations, "meta-description"),
      "observation-meta",
    );
  }

  if (!hasEvidenceCandidate(candidates, "hero-supporting-headline")) {
    appendObservationCandidate(
      candidates,
      findObservation(observations, "h2"),
      "observation-h2",
    );
  }

  if (!hasEvidenceCandidate(candidates, "supporting-section-heading")) {
    appendObservationCandidate(
      candidates,
      findObservation(observations, "h3"),
      "observation-h3",
    );
  }

  if (!hasEvidenceCandidate(candidates, "cta")) {
    appendObservationCandidate(
      candidates,
      findObservation(observations, "button"),
      "observation-cta",
    );
  }

  return candidates;
}

/**
 * Builds structured offering catalog fields from evidence and observation fallbacks.
 */
export function buildOfferingCatalog({
  websiteEvidence,
  observations,
}: ExtractOfferingInput): OfferingCatalog {
  const navigationLinks =
    websiteEvidence.navigation?.primaryLinks ??
    observationValuesInOrder(observations, "navigation-link");

  const categories = uniqueValues(
    navigationLinks.filter(
      (link) => !NON_OFFERING_NAVIGATION_LABELS.has(link.toLowerCase()),
    ),
  );

  const products = uniqueValues([
    ...observationValuesInOrder(observations, "list-item"),
    ...observationValuesInOrder(observations, "product-schema"),
  ]);

  return {
    products,
    services: [],
    categories,
  };
}
