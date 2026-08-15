import type { Observation } from "@/src/types/observation";

import type { BrandCandidateSource, RawBrandCandidate } from "./types";

const DOMAIN_OBSERVATION_ID = "domain::hostname";

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
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

/**
 * Extracts brand-name candidates from title, H1, meta description, and domain.
 *
 * Every candidate is traceable to an observation ID or a deterministic
 * hostname derivation from the page URL.
 */
export function extractCandidates(
  observations: Observation[],
): RawBrandCandidate[] {
  const candidates: RawBrandCandidate[] = [];

  const titleObservation = observations.find(
    (observation) => observation.sourceType === "title",
  );
  const h1Observation = observations.find(
    (observation) => observation.sourceType === "h1",
  );
  const metaObservation = observations.find(
    (observation) => observation.sourceType === "meta-description",
  );

  if (titleObservation?.rawValue) {
    const title = titleObservation.rawValue.trim();

    appendCandidate(
      candidates,
      title,
      "title",
      titleObservation.id,
      titleObservation.selector,
      titleObservation.rawValue,
    );

    const titlePrefix = extractTitlePrefix(title);

    if (titlePrefix && titlePrefix !== title) {
      appendCandidate(
        candidates,
        titlePrefix,
        "title",
        titleObservation.id,
        titleObservation.selector,
        titleObservation.rawValue,
      );
    }
  }

  if (h1Observation?.rawValue) {
    appendCandidate(
      candidates,
      h1Observation.rawValue,
      "h1",
      h1Observation.id,
      h1Observation.selector,
      h1Observation.rawValue,
    );
  }

  if (metaObservation?.rawValue) {
    appendCandidate(
      candidates,
      metaObservation.rawValue,
      "meta-description",
      metaObservation.id,
      metaObservation.selector,
      metaObservation.rawValue,
    );
  }

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

  return candidates;
}

export function extractDomainFromObservations(
  observations: Observation[],
): string {
  return extractDomain(observations);
}

export function extractWebsiteTitle(
  observations: Observation[],
): string {
  return (
    observations.find((observation) => observation.sourceType === "title")
      ?.rawValue ?? ""
  );
}
