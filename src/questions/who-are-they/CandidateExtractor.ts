import type { WebsiteEvidence } from "@/src/evidence/EvidenceTypes";
import type { Observation } from "@/src/types/observation";
import type { BrandCandidateSource, RawBrandCandidate } from "./types";

export interface ExtractCandidatesInput {
  websiteEvidence: WebsiteEvidence;
  observations: Observation[];
}
const key = (text: string) => text.trim().replace(/\s+/g, " ").toLowerCase();
const generic = /^(home|homepage|welcome|welcome home|official website|shop|shop now|buy now|products|services|about us|contact us)$/i;

export function extractDomainFromObservations(observations: Observation[]): string {
  try { return new URL(observations.find(o => o.pageUrl.trim())?.pageUrl ?? "").hostname; }
  catch { return ""; }
}
export function extractWebsiteTitle({observations}: Pick<ExtractCandidatesInput, "observations">): string {
  return observations.find(o => o.sourceType === "title")?.rawValue ?? "";
}

/** Only traceable page observations create name candidates. Structured strings
 * without source references cannot manufacture additional corroboration. */
export function extractCandidates({observations}: ExtractCandidatesInput): RawBrandCandidate[] {
  const candidates: RawBrandCandidate[] = [];
  const append = (value: string, sourceType: BrandCandidateSource, observationId: string, selector: string, rawValue: string) => {
    const cleaned = value.trim().replace(/\s+/g, " ");
    if (!cleaned || generic.test(cleaned) || cleaned.length > 100 || cleaned.split(" ").length > 8 || /[<>]/.test(cleaned)) return;
    candidates.push({value:cleaned, normalized:key(cleaned), sourceType, observationId, selector, rawValue});
  };
  const title = observations.find(o => o.sourceType === "title");
  const h1 = observations.find(o => o.sourceType === "h1");
  if (title) {
    // Split title/tagline separators, but retain internal hyphens in brand names.
    const parts = title.rawValue.split(/\s*[|]\s*|\s+[-–—]\s+/);
    const prefix = generic.test(parts[0].trim()) ? parts[1] ?? "" : parts[0];
    append(prefix, "title", title.id, title.selector, title.rawValue);
  }
  if (h1 && h1.id !== title?.id) {
    const prefix = h1.rawValue.split(/\s*[|]\s*|\s+[-–—]\s+/)[0];
    const value = candidates.some(c => c.sourceType === "title" && c.normalized === key(prefix)) ? prefix : h1.rawValue;
    append(value, "h1", h1.id, h1.selector, h1.rawValue);
  }
  // A meta description is descriptive copy, not a standalone organization name.
  const hostname = extractDomainFromObservations(observations);
  if (hostname) {
    const bare = hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
    const labels = bare.split(".");
    // Use exact matches only. Do not guess a registrable domain from co.uk,
    // arbitrary subdomains, punctuation removal, stemming, or fuzzy matching.
    const matches = candidates.filter(c => key(c.value).replace(/^www\./, "") === bare ||
      (labels.length === 2 && /^[a-z][a-z0-9-]*$/.test(labels[0]) && c.normalized === labels[0]));
    const matchedNames = new Set(matches.map(c => c.normalized));
    if (matchedNames.size === 1) {
      const name = matches[0];
      append(name.value, "domain", "domain::hostname", "hostname", hostname);
    } else if (!candidates.length) {
      append(hostname, "domain", "domain::hostname", "hostname", hostname);
    }
    // Domain variants are aliases only when they exactly match the observed host.
    const canonical = candidates.find(c => c.sourceType !== "domain" && labels.length === 2 && c.normalized === labels[0]);
    if (canonical) for (const candidate of candidates) {
      if (candidate.normalized.replace(/^www\./, "") === bare) candidate.normalized = canonical.normalized;
    }
  }
  return candidates;
}
