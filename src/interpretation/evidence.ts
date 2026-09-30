import { createHash } from "node:crypto";
import type { Observation } from "../types/observation";
import type { InterpretationContent } from "./types";

export function evidenceSnapshot(observations: Observation[]) {
  const priority = ["title", "meta-description", "h1", "paragraph", "h2", "h3", "navigation-link", "button", "list-item", "footer-link"];
  const sources: { id: string; pageUrl: string; selector: string; text: string }[] = [];
  let size = 0;
  for (const type of priority) for (const o of observations.filter((o) => o.sourceType === type)) {
    const source = { id: o.id, pageUrl: o.pageUrl, selector: o.selector, text: o.rawValue };
    const length = JSON.stringify(source).length;
    if (!o.rawValue.trim() || sources.some((s) => s.id === o.id) || sources.length >= 80 || size + length > 16000) continue;
    sources.push(source); size += length;
  }
  return { sources, omittedCount: observations.length - sources.length, snapshotId: createHash("sha256").update(JSON.stringify(sources)).digest("hex") };
}

const text = (v: unknown, max = 1200): v is string => typeof v === "string" && v.trim().length > 0 && v.length <= max;
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export function validateInterpretation(value: unknown, sources: ReturnType<typeof evidenceSnapshot>["sources"]): InterpretationContent {
  const citations = (v: unknown) => Array.isArray(v) && v.length > 0 && v.length <= 5 && v.every((c) => object(c) && text(c.sourceId) && text(c.quote, 700) && c.quote.trim().length >= 8 && sources.some((s) => s.id === c.sourceId && s.text.includes(c.quote as string)));
  if (!object(value) || !text(value.summary) || !citations(value.summaryCitations) || !Array.isArray(value.findings) || value.findings.length > 3 || !value.findings.every((f) => object(f) && text(f.title, 160) && text(f.explanation) && text(f.customerQuestion, 400) && text(f.suggestedChange) && text(f.factsToConfirm, 600) && citations(f.citations))) throw new Error("Invalid interpretation");
  // Citation existence is verified here; semantic support and factual truth are NOT established.
  return value as unknown as InterpretationContent;
}
