import type { WebsiteEvidence } from "@/src/evidence/EvidenceTypes";
import type { Observation } from "@/src/types/observation";

import type { BrandCandidateSource, RawBrandCandidate } from "./types";

const DOMAIN_OBSERVATION_ID = "domain::hostname";

export interface ExtractCandidatesInput {
  websiteEvidence: WebsiteEvidence;
  observations: Observation[];
}

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

function trimValue(value: string): string {
  return value.trim();
}

function extractTitlePrefix(title: string): string {
  const pipeIndex = title.indexOf("|");
  const dashIndex = title.indexOf("-");
  const separatorIndex = firstSeparatorIndex(pipeIndex, dashIndex);

  if (separatorIndex === -1) {
    return "";
  }

  return title.slice(0, separatorIndex).trim();
}

function firstSeparatorIndex(pipeIndex: number, dashIndex: number): number {
  if (pipeIndex === -1) {
    return dashIndex;
  }

  if (dashIndex === -1) {
    return pipeIndex;
  }

  return Math.min(pipeIndex, dashIndex);
}

function extractDomain(observations: Observation[]): string {
  const pageUrl = observations.find(
    (observation) => observation.pageUrl.trim().length > 0,
  )?.pageUrl;

  if (!pageUrl) {
    return "";
  }

  try {
    return new URL(pageUrl).hostname;
  } catch {
    return "";
  }
}

function domainCandidates(hostname: string): string[] {
  if (!hostname) {
    return [];
  }

  const values = [hostname];
  const withoutWww = hostname.toLowerCase().startsWith("www.")
    ? hostname.slice(4)
    : hostname;

  if (withoutWww !== hostname) {
    values.push(withoutWww);
  }

  const labels = withoutWww.split(".");
  if (labels.length >= 2 && labels[0]) {
    values.push(labels[0]);
  }

  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function findObservation(
  observations: Observation[],
  sourceType: Observation["sourceType"],
): Observation | undefined {
  return observations.find((observation) => observation.sourceType === sourceType);
}

function appendCandidate(
  candidates: RawBrandCandidate[],
  value: string,
  sourceType: BrandCandidateSource,
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

function appendFromObservation(
  candidates: RawBrandCandidate[],
  value: string,
  sourceType: BrandCandidateSource,
  observation: Observation,
): void {
  appendCandidate(
    candidates,
    value,
    sourceType,
    observation.id,
    observation.selector,
    observation.rawValue,
  );
}

function appendTitlePrefixFromObservation(
  candidates: RawBrandCandidate[],
  titleObservation: Observation,
): void {
  const title = trimValue(titleObservation.rawValue);
  const titlePrefix = extractTitlePrefix(title);

  if (titlePrefix && titlePrefix !== title) {
    appendFromObservation(
      candidates,
      titlePrefix,
      "title",
      titleObservation,
    );
  }
}

function appendTitleCandidatesFromObservation(
  candidates: RawBrandCandidate[],
  titleObservation: Observation | undefined,
): void {
  if (!titleObservation?.rawValue) {
    return;
  }

  const title = trimValue(titleObservation.rawValue);

  appendFromObservation(candidates, title, "title", titleObservation);
  appendTitlePrefixFromObservation(candidates, titleObservation);
}

function appendHeroBrandNameCandidate(
  candidates: RawBrandCandidate[],
  brandName: string,
  titleObservation: Observation | undefined,
  h1Observation: Observation | undefined,
): void {
  if (titleObservation && brandName === trimValue(titleObservation.rawValue)) {
    appendFromObservation(candidates, brandName, "title", titleObservation);
    appendTitlePrefixFromObservation(candidates, titleObservation);
    return;
  }

  if (h1Observation && brandName === trimValue(h1Observation.rawValue)) {
    appendFromObservation(candidates, brandName, "h1", h1Observation);
    return;
  }

  if (titleObservation) {
    appendFromObservation(candidates, brandName, "title", titleObservation);
    appendTitlePrefixFromObservation(candidates, titleObservation);
    return;
  }

  if (h1Observation) {
    appendFromObservation(candidates, brandName, "h1", h1Observation);
  }
}

function appendHeroMainHeadlineCandidate(
  candidates: RawBrandCandidate[],
  mainHeadline: string,
  brandName: string | undefined,
  h1Observation: Observation | undefined,
): void {
  if (!h1Observation?.rawValue) {
    return;
  }

  if (trimValue(h1Observation.rawValue) !== mainHeadline) {
    return;
  }

  if (brandName && brandName === mainHeadline) {
    return;
  }

  appendFromObservation(candidates, mainHeadline, "h1", h1Observation);
}

function appendMetaDescriptionFromObservations(
  candidates: RawBrandCandidate[],
  metaObservation: Observation | undefined,
): void {
  if (!metaObservation?.rawValue) {
    return;
  }

  appendFromObservation(
    candidates,
    metaObservation.rawValue,
    "meta-description",
    metaObservation,
  );
}

function appendDomainCandidatesFromObservations(
  candidates: RawBrandCandidate[],
  observations: Observation[],
): void {
  const domain = extractDomain(observations);

  for (const domainValue of domainCandidates(domain)) {
    appendCandidate(
      candidates,
      domainValue,
      "domain",
      DOMAIN_OBSERVATION_ID,
      "hostname",
      domain,
    );
  }
}

/**
 * Extracts brand-name candidates from website evidence with observation fallbacks.
 *
 * Primary sources: WebsiteEvidence.hero fields.
 * Fallback sources: observations for fields not yet exposed by the evidence layer.
 */
export function extractCandidates({
  websiteEvidence,
  observations,
}: ExtractCandidatesInput): RawBrandCandidate[] {
  const candidates: RawBrandCandidate[] = [];
  const hero = websiteEvidence.hero;
  const titleObservation = findObservation(observations, "title");
  const h1Observation = findObservation(observations, "h1");
  const metaObservation = findObservation(observations, "meta-description");

  if (hero?.brandName) {
    appendHeroBrandNameCandidate(
      candidates,
      hero.brandName,
      titleObservation,
      h1Observation,
    );
  } else {
    appendTitleCandidatesFromObservation(candidates, titleObservation);

    if (h1Observation?.rawValue) {
      appendFromObservation(
        candidates,
        h1Observation.rawValue,
        "h1",
        h1Observation,
      );
    }
  }

  if (hero?.mainHeadline) {
    appendHeroMainHeadlineCandidate(
      candidates,
      hero.mainHeadline,
      hero.brandName,
      h1Observation,
    );
  }

  appendMetaDescriptionFromObservations(candidates, metaObservation);
  appendDomainCandidatesFromObservations(candidates, observations);

  return candidates;
}

export function extractDomainFromObservations(
  observations: Observation[],
): string {
  return extractDomain(observations);
}

export function extractWebsiteTitle({
  observations,
}: Pick<ExtractCandidatesInput, "observations">): string {
  return findObservation(observations, "title")?.rawValue ?? "";
}
