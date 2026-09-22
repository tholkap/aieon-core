import { mapDiscoveryToBusinessProfile, type BusinessQuestion } from "@/components/discovery/mapBusinessProfile";
import type { Observation } from "@/src/types/observation";
import type { ResolvedIdentity } from "@/src/types/resolved-identity";

export interface BlindSpot { id: string; title: string; impact: string; question: string }
export interface Recommendation {
  id: string; title: string; description: string; relatedQuestion: string;
}
export interface AiUnderstandingReport {
  interpretation?: import("@/src/interpretation/types").InterpretationResult;
  websiteUrl: string;
  scannedAt: string;
  brandName: string | null;
  summaryHeadline: string;
  summaryBody: string;
  questions: BusinessQuestion[];
  blindSpots: BlindSpot[];
  recommendations: Recommendation[];
  stats: { clear: number; partial: number; missing: number; notAssessed: number; assessed: number };
}

const REVIEW_COPY: Record<string, { title: string; impact: string; improvement: string }> = {
  who: {
    title: "Identity needs review",
    impact: "AiEON could not corroborate a single brand name using its current checks. Inspect the evidence before treating this as a website problem.",
    improvement: "Check the brand names quoted below. If they are genuinely inconsistent, correct them. If they already agree, this is an AiEON matching limitation rather than a reason to rewrite your site.",
  },
  what: {
    title: "Offering description needs review",
    impact: "AiEON found limited offering evidence. A product name or slogan alone does not explain what a business provides.",
    improvement: "Review the quoted offering evidence. If your homepage lacks a clear product or service description, add one and reflect it in the page description. Rescan to check whether AiEON identifies the change; identical wording is not required for good communication.",
  },
  audience: {
    title: "Audience description needs review",
    impact: "AiEON did not find a clear audience statement using its current English wording checks on this page. This can be a coverage limitation.",
    improvement: "Review who your offering is intended for. If that is not stated, add an accurate audience sentence near the offering description and rescan. Do not rewrite clear existing copy just to match AiEON.",
  },
  action: {
    title: "Customer actions need review",
    impact: "No explicit action wording was identified in the buttons, navigation, and footer checked. Other links are not covered by this check yet.",
    improvement: "Check whether visitors can clearly buy, book, subscribe, or contact you. If an appropriate action is absent, add a descriptive control and rescan. AiEON currently checks wording, not whether the action works.",
  },
};

export function mapDiscoveryToAiUnderstanding(url: string, observations: Observation[], identity: ResolvedIdentity): AiUnderstandingReport {
  const base = mapDiscoveryToBusinessProfile(url, observations, identity);
  const assessed = base.questions.filter((q) => q.assessment !== "not-assessed");
  const stats = {
    clear: assessed.filter((q) => q.status === "found").length,
    partial: assessed.filter((q) => q.status === "partial").length,
    missing: assessed.filter((q) => q.status === "missing").length,
    notAssessed: base.questions.length - assessed.length,
    assessed: assessed.length,
  };
  const reviews = assessed.filter((q) => q.status !== "found");
  const who = base.questions.find((q) => q.id === "who");
  const brandName = who?.status === "found" ? who.summary : null;
  return {
    ...base,
    brandName,
    summaryHeadline: brandName ? `What AiEON found about ${brandName}` : "What AiEON found on this page",
    summaryBody: `AiEON checked ${stats.assessed} of six business questions using the page content it could extract. ${stats.clear} returned supported signals; ${stats.partial + stats.missing} need review. The remaining ${stats.notAssessed} questions are not assessed yet. This report does not test ChatGPT, Gemini, Claude, or their recommendations.`,
    stats,
    blindSpots: reviews.map((q) => ({
      id: q.id, question: q.question,
      title: REVIEW_COPY[q.id]?.title ?? q.question,
      impact: REVIEW_COPY[q.id]?.impact ?? "Review the available evidence.",
    })),
    recommendations: reviews.map((q) => ({
      id: `rec-${q.id}`, relatedQuestion: q.question,
      title: REVIEW_COPY[q.id]?.title ?? q.question,
      description: REVIEW_COPY[q.id]?.improvement ?? "Review the available evidence before editing your website.",
    })),
  };
}
