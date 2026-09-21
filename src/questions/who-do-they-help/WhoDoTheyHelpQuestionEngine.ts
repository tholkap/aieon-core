import type { QuestionEngine } from "../shared/QuestionEngine";

// Deliberately bounded English patterns. Matches describe site claims, not verified customers.
const audience = String.raw`(?:(?:small|medium|large|local|independent|global|enterprise|business|leisure)\s+){0,3}(?:businesses|companies|enterprises|startups|teams|developers|designers|students|teachers|schools|universities|professionals|families|travellers|travelers|patients|retailers|manufacturers|agencies|nonprofits|consumers)\b`;
const direct = new RegExp(String.raw`^we\s+(?:serve|help|support|work with)\s+${audience}`, "i");
const provision = new RegExp(String.raw`^we\s+(?:provide|offer|build|create|design)\s+[^.!?]{1,120}\s+for\s+${audience}`, "i");
const headline = new RegExp(String.raw`^(?:software|a platform|services|accounting services|training|courses|accommodation|tools)\s+for\s+${audience}`, "i");
const unsafe = /[<>?"“”]|\b(?:not|no|never|might|may|would|could|wish|hope|plan|except|excluding)\b/i;

export const whoDoTheyHelpQuestionEngine: QuestionEngine = {
  id: "audience",
  analyze(context) {
    const candidates = context.observations.flatMap((o) => {
      if (!["paragraph", "h1", "meta-description"].includes(o.sourceType)) return [];
      const text = o.rawValue.trim().replace(/\s+/g, " ");
      if (text.length > 600 || unsafe.test(text)) return [];
      const explicit = direct.test(text) || provision.test(text);
      const tentative = o.sourceType !== "paragraph" && headline.test(text);
      return explicit || tentative ? [{ observation: o, explicit }] : [];
    });
    const unique = [...new Map(candidates.map((c) => [c.observation.rawValue.trim().toLowerCase(), c])).values()];
    const explicit = unique.some((c) => c.explicit);
    const status = explicit ? "found" : unique.length ? "partial" : "missing";
    return {
      questionId: "audience", question: "Who do they help?", sectionTitle: "Who you help",
      answer: unique.length
        ? `Your page describes its audience: ${unique.slice(0, 3).map((c) => c.observation.rawValue).join(" · ")}`
        : "No explicit audience statement identified by the current checks on this page.",
      // Rule support levels, not calibrated probabilities. Repetition does not increase confidence.
      confidence: explicit ? 1 : unique.length ? 0.5 : 0,
      status,
      evidence: unique.map(({ observation: o }) => ({ observationId: o.id, sourceType: o.sourceType, selector: o.selector, rawValue: o.rawValue, weight: 1 })),
      reasoning: [
        "Checked the first main heading, page description, and eligible body paragraphs for explicit English audience statements. Navigation labels and inferred demographics are excluded.",
        "Quotes are website claims, not independently verified customer relationships. Confidence describes rule support, not a probability that the claim is true.",
        "Coverage is limited to this page and recognized wording. An unmatched statement does not establish that audience information is absent from the website.",
      ],
      blindSpots: status === "found" ? [] : [{ id: "audience-review", title: "Audience wording needs review", description: "Review this page for an explicit statement of who the products or services are intended for; other wording may be outside AiEON's current coverage." }],
      recommendations: status === "found" ? [] : [{ id: "audience-copy", priority: "medium", title: "Check your audience description", description: "If the intended customers are not stated, add an accurate sentence near the offering description. Rescan to check whether it is identified." }],
    };
  },
  buildDetails(analysis) { return analysis.evidence.map((e) => e.rawValue); },
};
