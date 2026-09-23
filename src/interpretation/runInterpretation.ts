import type { Observation } from "../types/observation";
import type { InterpretationResult } from "./types";
import { evidenceSnapshot, validateInterpretation } from "./evidence";
import { instructions, PROMPT_VERSION, schema } from "./prompt";

// Private-pilot guard only; restarts reset it. Provider project spend limits are still required.
let windowStart = Date.now();
let calls = 0;
export async function runInterpretation(observations: Observation[], env: Record<string, string | undefined> = process.env, transport: typeof fetch = fetch): Promise<InterpretationResult> {
  const provider = env.AIEON_AI_PROVIDER ?? "gemini";
  const model = provider === "gemini" ? "gemini-2.5-flash" : env.AIEON_AI_MODEL;
  const key = provider === "gemini" ? env.GEMINI_API_KEY : env.OPENAI_API_KEY;
  // Explicit OpenAI selection is required. Never fall back to another provider.
  if (env.AIEON_AI_ENABLED !== "true" || !["gemini", "openai"].includes(provider) || !key || !model) return { status: "not-configured" };
  if (Date.now() - windowStart >= 3600000) { windowStart = Date.now(); calls = 0; }
  if (calls >= 10) return { status: "limited" };
  const snapshot = evidenceSnapshot(observations);
  if (!snapshot.sources.length) return { status: "unavailable" };
  calls++;
  try {
    const endpoint = provider === "gemini"
      ? "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
      : "https://api.openai.com/v1/responses";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (provider === "gemini") headers["x-goog-api-key"] = key;
    else headers.Authorization = `Bearer ${key}`;
    const body = provider === "gemini" ? {
      systemInstruction: { parts: [{ text: instructions }] },
      contents: [{ role: "user", parts: [{ text: JSON.stringify(snapshot) }] }],
      generationConfig: { responseMimeType: "application/json", responseJsonSchema: schema, maxOutputTokens: 2400, candidateCount: 1, thinkingConfig: { thinkingBudget: 0 } },
    } : { model, store: false, instructions, input: JSON.stringify(snapshot), max_output_tokens: 2400, text: { format: { type: "json_schema", name: "aieon_interpretation", strict: true, schema } } };
    const response = await transport(endpoint, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(25000),
      headers,
      body: JSON.stringify(body),
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
    let texts: string[];
    if (provider === "gemini") {
      const candidate = data.candidates?.[0];
      if (data.promptFeedback?.blockReason || candidate?.finishReason !== "STOP" || !Array.isArray(candidate?.content?.parts)) throw new Error("Incomplete Gemini response");
      texts = candidate.content.parts.filter((p: { text?: unknown; thought?: boolean }) => typeof p.text === "string" && !p.thought).map((p: { text: string }) => p.text);
    } else {
      if (data.status !== "completed" || !Array.isArray(data.output)) throw new Error("Incomplete response");
      texts = data.output.flatMap((item: { type?: string; content?: { type?: string; text?: string }[] }) => item.type === "message" && Array.isArray(item.content) ? item.content.filter((c) => c.type === "output_text" && typeof c.text === "string").map((c) => c.text) : []);
    }
    const content = validateInterpretation(JSON.parse(texts.join("")), snapshot.sources);
    return { status: "complete", content, model: `${provider}: ${typeof data.modelVersion === "string" ? data.modelVersion : typeof data.model === "string" ? data.model : model}`, snapshotId: snapshot.snapshotId, promptVersion: PROMPT_VERSION, generatedAt: new Date().toISOString(), sourceCount: snapshot.sources.length, omittedCount: snapshot.omittedCount, sources: snapshot.sources };
  } catch { return { status: "unavailable" }; }
}
