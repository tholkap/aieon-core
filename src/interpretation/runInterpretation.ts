import type { Observation } from "../types/observation";
import type { InterpretationResult } from "./types";
import { evidenceSnapshot, validateInterpretation } from "./evidence";
import { instructions, PROMPT_VERSION, schema } from "./prompt";

// Private-pilot guard only; restarts reset it. Provider project spend limits are still required.
let windowStart = Date.now();
let calls = 0;
export async function runInterpretation(observations: Observation[], env: Record<string, string | undefined> = process.env, transport: typeof fetch = fetch): Promise<InterpretationResult> {
  if (env.AIEON_AI_ENABLED !== "true" || !env.OPENAI_API_KEY || !env.AIEON_AI_MODEL) return { status: "not-configured" };
  if (Date.now() - windowStart >= 3600000) { windowStart = Date.now(); calls = 0; }
  if (calls >= 10) return { status: "limited" };
  const snapshot = evidenceSnapshot(observations);
  if (!snapshot.sources.length) return { status: "unavailable" };
  calls++;
  try {
    const response = await transport("https://api.openai.com/v1/responses", {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(25000),
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: env.AIEON_AI_MODEL, store: false, instructions, input: JSON.stringify(snapshot), max_output_tokens: 2400, text: { format: { type: "json_schema", name: "aieon_interpretation", strict: true, schema } } }),
    });
    if (!response.ok || !response.body) throw new Error("Provider unavailable");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = []; let bytes = 0;
    try {
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        bytes += value.byteLength;
        if (bytes > 128000) throw new Error("Response too large");
        chunks.push(value);
      }
    } finally { await reader.cancel(); }
    const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (data.status !== "completed" || !Array.isArray(data.output)) throw new Error("Incomplete response");
    const texts = data.output.flatMap((item: { type?: string; content?: { type?: string; text?: string }[] }) => item.type === "message" && Array.isArray(item.content) ? item.content.filter((c) => c.type === "output_text" && typeof c.text === "string").map((c) => c.text) : []);
    const content = validateInterpretation(JSON.parse(texts.join("")), snapshot.sources);
    return { status: "complete", content, model: typeof data.model === "string" ? data.model : env.AIEON_AI_MODEL, snapshotId: snapshot.snapshotId, promptVersion: PROMPT_VERSION, generatedAt: new Date().toISOString(), sourceCount: snapshot.sources.length, omittedCount: snapshot.omittedCount, sources: snapshot.sources };
  } catch { return { status: "unavailable" }; }
}
