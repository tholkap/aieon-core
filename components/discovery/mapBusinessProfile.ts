import type { BusinessQuestion as EngineQuestion, BusinessQuestionStatus } from "@/src/questions/shared/types";
import { createQuestionEngineContext } from "@/src/questions/shared/QuestionEngine";
import { mapAnalysisToBusinessQuestion } from "@/src/questions/shared/QuestionMapper";
import { whoAreTheyQuestionEngine } from "@/src/questions/who-are-they/WhoAreTheyQuestionEngine";
import { whatDoTheyOfferQuestionEngine } from "@/src/questions/what-do-they-offer/WhatDoTheyOfferQuestionEngine";
import type { Observation } from "@/src/types/observation";
import type { ResolvedIdentity } from "@/src/types/resolved-identity";

export type { BusinessQuestionStatus };
export type AnswerStatus = BusinessQuestionStatus;

// Presentation metadata only; the shared Question Engine contract is unchanged.
export interface BusinessQuestion extends EngineQuestion {
  assessment?: "not-assessed";
  sources?: { observationId: string; pageUrl: string; sourceType: string; selector: string; quote: string }[];
}
export interface BusinessProfile {
  websiteUrl: string;
  scannedAt: string;
  questions: BusinessQuestion[];
}

function sourceDetails(observations: Observation[]): NonNullable<BusinessQuestion["sources"]> {
  return [...new Map(observations.map((o) => [o.id, o])).values()].map((o) => ({
    observationId: o.id, pageUrl: o.pageUrl, sourceType: o.sourceType, selector: o.selector, quote: o.rawValue,
  }));
}

function notAssessed(id: string, question: string, sectionTitle: string): BusinessQuestion {
  return {
    id, question, sectionTitle, status: "missing", assessment: "not-assessed",
    summary: "This question is not yet assessed by AiEON.",
    details: [],
    howDetermined: ["This check is not implemented in the current report. No conclusion has been drawn about whether your website contains this information."],
  };
}

function buildWhatToDoNext(observations: Observation[]): BusinessQuestion {
  const actionLabel = /^(?:buy|shop|order|reorder|book|reserve|contact|subscribe|apply|download|request (?:a )?(?:quote|demo)|get (?:a )?(?:quote|demo)|start (?:a |your )?(?:free )?trial|sign up)\b/i;
  const navigationOnly = /^(?:order (?:status|history)|bookmarks?)\b/i;
  const actions = observations.filter((o) =>
    ["button", "navigation-link", "footer-link"].includes(o.sourceType) &&
    actionLabel.test(o.rawValue.trim()) && !navigationOnly.test(o.rawValue.trim()),
  );
  const labels = [...new Set(actions.map((o) => o.rawValue.trim()))];
  return {
    id: "action", question: "What can visitors do?", sectionTitle: "What visitors can do",
    summary: labels.length ? `Action wording found: ${labels.slice(0, 6).join(", ")}.` : "No explicit customer action wording identified in the controls checked.",
    status: labels.length ? "found" : "missing",
    details: labels.slice(0, 12),
    sources: sourceDetails(actions),
    howDetermined: [
      "Checked buttons, navigation links, and footer links for explicit action wording such as buy, book, contact, or subscribe.",
      "Ordinary navigation labels are excluded. Destinations and completion of these actions have not been tested. Links elsewhere on the page are not covered yet.",
    ],
  };
}

export function mapDiscoveryToBusinessProfile(url: string, observations: Observation[], identity: ResolvedIdentity): BusinessProfile {
  const context = createQuestionEngineContext(observations, identity);
  const questions: BusinessQuestion[] = [whoAreTheyQuestionEngine, whatDoTheyOfferQuestionEngine].map((engine) => {
    const analysis = engine.analyze(context);
    const ids = new Set(analysis.evidence.map((e) => e.observationId));
    return {
      ...mapAnalysisToBusinessQuestion(analysis, () => engine.buildDetails(analysis, context)),
      sources: sourceDetails(observations.filter((o) => ids.has(o.id))),
    };
  });
  return {
    websiteUrl: url,
    scannedAt: observations[0]?.discoveredAt ?? new Date().toISOString(),
    questions: [
      ...questions,
      notAssessed("audience", "Who do they help?", "Who you help"),
      notAssessed("trust", "Why trust them?", "Why trust you"),
      notAssessed("choose", "Why choose them?", "Why choose you"),
      buildWhatToDoNext(observations),
    ],
  };
}
