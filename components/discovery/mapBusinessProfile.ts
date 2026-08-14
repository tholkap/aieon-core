import { execute as executeWhoAreThey } from "@/src/questions/who-are-they/execute";
import type {
  BusinessQuestion,
  BusinessQuestionStatus,
} from "@/src/questions/shared/types";
import type { Observation } from "@/src/types/observation";
import type { ResolvedIdentity } from "@/src/types/resolved-identity";

export type { BusinessQuestion, BusinessQuestionStatus };
export type AnswerStatus = BusinessQuestionStatus;

export interface BusinessProfile {
  websiteUrl: string;
  scannedAt: string;
  questions: BusinessQuestion[];
}

function observationValue(
  observations: Observation[],
  sourceType: Observation["sourceType"],
): string | undefined {
  return observations.find((o) => o.sourceType === sourceType)?.rawValue;
}

function observationsByType(
  observations: Observation[],
  sourceTypes: Observation["sourceType"][],
): Observation[] {
  return observations.filter((o) => sourceTypes.includes(o.sourceType));
}

function buildWhatDoTheyDo(observations: Observation[]): BusinessQuestion {
  const h1 = observationValue(observations, "h1");
  const meta = observationValue(observations, "meta-description");
  const details: string[] = [];

  if (h1) {
    details.push(`Main headline: ${h1}`);
  }

  if (meta) {
    details.push(`Site description: ${meta}`);
  }

  const summary = h1 ?? meta ?? "Not found on your website";
  const status: AnswerStatus = h1 ? "found" : meta ? "partial" : "missing";

  return {
    id: "what",
    question: "What do they do?",
    sectionTitle: "What you do",
    summary,
    details,
    status,
  };
}

function buildWhoDoTheyHelp(): BusinessQuestion {
  return {
    id: "audience",
    question: "Who do they help?",
    sectionTitle: "Who you help",
    summary: "Not found on your website",
    details: [],
    status: "missing",
  };
}

function buildWhyTrustThem(observations: Observation[]): BusinessQuestion {
  const reviews = observations.filter((o) => o.sourceType === "review");

  if (reviews.length === 0) {
    return {
      id: "trust",
      question: "Why trust them?",
      sectionTitle: "Why trust you",
      summary: "Not found on your website",
      details: [],
      status: "missing",
    };
  }

  return {
    id: "trust",
    question: "Why trust them?",
    sectionTitle: "Why trust you",
    summary: "Trust signals were found on your public site.",
    details: reviews.map((r) => r.rawValue),
    status: "found",
  };
}

function buildWhyChooseThem(observations: Observation[]): BusinessQuestion {
  const headings = observationsByType(observations, ["h2", "h3"]).map(
    (o) => o.rawValue,
  );

  if (headings.length === 0) {
    return {
      id: "choose",
      question: "Why choose them?",
      sectionTitle: "Why choose you",
      summary: "Not found on your website",
      details: [],
      status: "missing",
    };
  }

  return {
    id: "choose",
    question: "Why choose them?",
    sectionTitle: "Why choose you",
    summary:
      "Supporting messages appear in section headings on your site. Full differentiation analysis is not yet available.",
    details: headings.slice(0, 6),
    status: "partial",
  };
}

function buildWhatToDoNext(observations: Observation[]): BusinessQuestion {
  const actions = observationsByType(observations, [
    "button",
    "navigation-link",
  ]);

  if (actions.length === 0) {
    return {
      id: "action",
      question: "What should the visitor do next?",
      sectionTitle: "What visitors can do",
      summary: "Not found on your website",
      details: [],
      status: "missing",
    };
  }

  const uniqueLabels = [...new Set(actions.map((a) => a.rawValue))];

  return {
    id: "action",
    question: "What should the visitor do next?",
    sectionTitle: "What visitors can do",
    summary: `${uniqueLabels.length} action pathway${uniqueLabels.length === 1 ? "" : "s"} found on your homepage.`,
    details: uniqueLabels.slice(0, 12),
    status: "found",
  };
}

export function mapDiscoveryToBusinessProfile(
  url: string,
  observations: Observation[],
  identity: ResolvedIdentity,
): BusinessProfile {
  return {
    websiteUrl: url,
    scannedAt: new Date().toISOString(),
    questions: [
      executeWhoAreThey(observations, identity),
      buildWhatDoTheyDo(observations),
      buildWhoDoTheyHelp(),
      buildWhyTrustThem(observations),
      buildWhyChooseThem(observations),
      buildWhatToDoNext(observations),
    ],
  };
}
