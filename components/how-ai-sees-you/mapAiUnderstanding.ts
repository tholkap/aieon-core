import {
  mapDiscoveryToBusinessProfile,
  type AnswerStatus,
  type BusinessProfile,
  type BusinessQuestion,
} from "@/components/discovery/mapBusinessProfile";
import { execute as executeWhoAreThey } from "@/src/questions/who-are-they/execute";
import type { Observation } from "@/src/types/observation";
import type { ResolvedIdentity } from "@/src/types/resolved-identity";

export type ReadinessLevel = "strong" | "moderate" | "weak" | "critical";

export interface BlindSpot {
  id: string;
  title: string;
  impact: string;
  question: string;
}

export interface Recommendation {
  id: string;
  priority: "high" | "medium";
  title: string;
  description: string;
  relatedQuestion: string;
}

export interface AiUnderstandingReport {
  websiteUrl: string;
  scannedAt: string;
  brandName: string | null;
  summaryHeadline: string;
  summaryBody: string;
  readinessScore: number;
  readinessLevel: ReadinessLevel;
  readinessLabel: string;
  questions: BusinessQuestion[];
  blindSpots: BlindSpot[];
  recommendations: Recommendation[];
  stats: {
    clear: number;
    partial: number;
    missing: number;
  };
}

const CUSTOMER_QUESTION_LABELS: Record<string, string> = {
  what: "What do they offer?",
};

const STATUS_SCORE: Record<AnswerStatus, number> = {
  found: 100,
  partial: 55,
  missing: 0,
};

const READINESS_THRESHOLDS: {
  min: number;
  level: ReadinessLevel;
  label: string;
}[] = [
  { min: 80, level: "strong", label: "Strong" },
  { min: 55, level: "moderate", label: "Moderate" },
  { min: 30, level: "weak", label: "Needs attention" },
  { min: 0, level: "critical", label: "Critical gaps" },
];

const BLIND_SPOT_COPY: Record<
  string,
  { title: string; impact: string; recommendation: Recommendation }
> = {
  who: {
    title: "Brand identity is unclear",
    impact:
      "AI assistants may hesitate to name your business or confuse you with similarly named companies.",
    recommendation: {
      id: "rec-who",
      priority: "high",
      title: "Make your brand name unmistakable",
      description:
        "Use your business name consistently in your page title, main headline, and logo alt text so every signal points to the same identity.",
      relatedQuestion: "Who are they?",
    },
  },
  what: {
    title: "Your offer is hard to parse",
    impact:
      "When AI cannot summarize what you sell or do, it will not recommend you for relevant searches or comparisons.",
    recommendation: {
      id: "rec-what",
      priority: "high",
      title: "State what you offer in plain language",
      description:
        "Add a clear headline and meta description that explain your product or service in one sentence a stranger would understand.",
      relatedQuestion: "What do they offer?",
    },
  },
  audience: {
    title: "Target audience is invisible",
    impact:
      "Without audience signals, AI may misclassify who you serve and surface you to the wrong people.",
    recommendation: {
      id: "rec-audience",
      priority: "high",
      title: "Name who you help on your homepage",
      description:
        "Include explicit language about your ideal customer, industry, or use case — for example, “for small business owners” or “enterprise security teams.”",
      relatedQuestion: "Who do they help?",
    },
  },
  trust: {
    title: "Trust signals are missing",
    impact:
      "AI systems weigh credibility heavily. Missing reviews, policies, or proof points make you harder to recommend confidently.",
    recommendation: {
      id: "rec-trust",
      priority: "medium",
      title: "Surface proof that builds confidence",
      description:
        "Add customer reviews, certifications, privacy policies, or case studies where visitors and AI can find them on your public site.",
      relatedQuestion: "Why trust them?",
    },
  },
  choose: {
    title: "Differentiation is vague",
    impact:
      "If AI cannot articulate why someone should pick you, it will default to generic descriptions or skip you in comparisons.",
    recommendation: {
      id: "rec-choose",
      priority: "medium",
      title: "Highlight what makes you the better choice",
      description:
        "Use section headings and supporting copy to spell out benefits, outcomes, or unique advantages — not just feature lists.",
      relatedQuestion: "Why choose them?",
    },
  },
  action: {
    title: "Next steps are unclear",
    impact:
      "When AI cannot see a path to buy, book, or contact you, it may describe your business without guiding anyone to act.",
    recommendation: {
      id: "rec-action",
      priority: "high",
      title: "Make the visitor journey obvious",
      description:
        "Ensure prominent buttons and navigation labels clearly state what someone can do next — get a demo, start a trial, contact sales, and so on.",
      relatedQuestion: "What should visitors do next?",
    },
  },
};

function applyCustomerLabels(questions: BusinessQuestion[]): BusinessQuestion[] {
  return questions.map((q) => {
    const label = CUSTOMER_QUESTION_LABELS[q.id];
    if (!label) {
      return q;
    }

    const sectionTitle =
      q.id === "what" ? "What you offer" : q.sectionTitle;

    return { ...q, question: label, sectionTitle };
  });
}

function computeReadiness(questions: BusinessQuestion[]): {
  score: number;
  level: ReadinessLevel;
  label: string;
} {
  const score = Math.round(
    questions.reduce((sum, q) => sum + STATUS_SCORE[q.status], 0) /
      questions.length,
  );

  const tier =
    READINESS_THRESHOLDS.find((t) => score >= t.min) ??
    READINESS_THRESHOLDS[READINESS_THRESHOLDS.length - 1];

  return { score, level: tier.level, label: tier.label };
}

function buildSummary(
  brandName: string | null,
  readiness: { score: number; label: string },
  stats: AiUnderstandingReport["stats"],
): { headline: string; body: string } {
  if (stats.missing === 6) {
    return {
      headline: "AI would struggle to understand this website",
      body: "We could not extract clear answers to any of the six questions AI assistants use when describing or recommending a business. Your public homepage needs foundational clarity before AI can represent you accurately.",
    };
  }

  if (readiness.score >= 80) {
    return {
      headline: brandName
        ? `${brandName} comes through clearly to AI`
        : "Your business comes through clearly to AI",
      body: `Most core questions about your business can be answered from your homepage today. AI assistants have enough public signals to describe who you are, what you offer, and how visitors can engage — with ${stats.missing} area${stats.missing === 1 ? "" : "s"} still worth strengthening.`,
    };
  }

  if (readiness.score >= 55) {
    return {
      headline: brandName
        ? `${brandName} is partially understood by AI`
        : "AI only partially understands this business",
      body: `Some essentials are visible on your site, but ${stats.partial + stats.missing} of six key questions remain incomplete. AI may describe you in general terms or omit important details when recommending you.`,
    };
  }

  return {
    headline: brandName
      ? `${brandName} has significant AI blind spots`
      : "This website has significant AI blind spots",
    body: `AI would have difficulty giving a confident, accurate picture of this business. ${stats.missing} critical question${stats.missing === 1 ? " is" : "s are"} unanswered from public content alone — leaving room for misrepresentation or silence in AI-driven discovery.`,
  };
}

function buildBlindSpots(questions: BusinessQuestion[]): BlindSpot[] {
  return questions
    .filter((q) => q.status !== "found")
    .map((q) => {
      const copy = BLIND_SPOT_COPY[q.id];
      return {
        id: q.id,
        title: copy?.title ?? q.question,
        impact: copy?.impact ?? `AI cannot confidently answer: ${q.question}`,
        question: q.question,
      };
    });
}

function buildRecommendations(questions: BusinessQuestion[]): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const q of questions) {
    if (q.status === "found") {
      continue;
    }

    const copy = BLIND_SPOT_COPY[q.id];
    if (copy) {
      recs.push(copy.recommendation);
    }
  }

  return recs.sort((a, b) => {
    if (a.priority === b.priority) {
      return 0;
    }
    return a.priority === "high" ? -1 : 1;
  });
}

function toCustomerProfile(base: BusinessProfile): AiUnderstandingReport {
  const questions = applyCustomerLabels(base.questions);
  const stats = {
    clear: questions.filter((q) => q.status === "found").length,
    partial: questions.filter((q) => q.status === "partial").length,
    missing: questions.filter((q) => q.status === "missing").length,
  };

  const brandName =
    questions.find((q) => q.id === "who")?.status === "found"
      ? questions.find((q) => q.id === "who")!.summary
      : null;

  const readiness = computeReadiness(questions);
  const summary = buildSummary(brandName, readiness, stats);

  return {
    websiteUrl: base.websiteUrl,
    scannedAt: base.scannedAt,
    brandName,
    summaryHeadline: summary.headline,
    summaryBody: summary.body,
    readinessScore: readiness.score,
    readinessLevel: readiness.level,
    readinessLabel: readiness.label,
    questions,
    blindSpots: buildBlindSpots(questions),
    recommendations: buildRecommendations(questions),
    stats,
  };
}

export function mapDiscoveryToAiUnderstanding(
  url: string,
  observations: Observation[],
  identity: ResolvedIdentity,
): AiUnderstandingReport {
  const base = mapDiscoveryToBusinessProfile(url, observations, identity);

  // TODO Sprint 5+: Delegate questions 2–6 to their src/questions/* modules.
  const questions: BusinessQuestion[] = [
    executeWhoAreThey(observations, identity),
    ...base.questions.slice(1),
  ];

  return toCustomerProfile({ ...base, questions });
}
