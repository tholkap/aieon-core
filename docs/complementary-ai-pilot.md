# Complementary AI pilot — 22 September 2026

## Product purpose

Add depth beyond restating identity and products: explain the business, identify zero to three substantive uncertainties linked to customer questions, and suggest concrete changes. Models complement the deterministic report; neither layer judges truth by agreement. Model findings never change deterministic question statuses.

## Implementation

The authenticated scan action optionally sends a bounded snapshot of extracted public-page observations to the OpenAI Responses API. The first adapter is provider-specific; evidence, validation and customer result types are separate from it. The shared Question Engine framework is untouched.

The user opts in before scanning. Each summary and finding requires exact source IDs and quotes. Runtime validation checks schema shape, field lengths, a maximum of three findings, and quote existence in the included evidence. This is citation integrity, NOT entailment or factual verification. Model text is rendered as text. Owners must review all suggestions and supply missing facts.

The input is limited to 80 observations and 16,000 serialized source characters, prioritizing descriptions/body copy over navigation. Full records that exceed the budget are omitted, not sliced. The UI discloses omissions. Snapshot SHA-256 and prompt version identify the supplied evidence and instructions; results are not persisted across sessions yet.

Controls: server-side key, fixed provider endpoint, redirects rejected, 25-second timeout, 2,400 maximum output tokens, 128 KB response limit, no tools, no automatic retry, store:false, ten attempts per hour per process plus existing scan concurrency/rate guards. The request ceiling resets on process restart and is NOT a monetary budget or distributed quota. Provider data policies still apply; store:false is not a claim of zero retention. No paid API was activated during development.

## Activation after founder approval

Keep the existing pilot password gate. In Render configure:

- OPENAI_API_KEY: restricted project API key, entered directly in Render, never chat or Git.
- AIEON_AI_MODEL: explicitly chosen model available to that project and supporting Responses structured outputs. No model is silently selected.
- AIEON_AI_ENABLED: true only after approving the pilot API budget and provider data handling.

Set provider project spending controls appropriate to that approved budget. A billing alert may not be a hard cap; verify the account controls before activation. Redeploy and opt into AI interpretation for each scan. Set AIEON_AI_ENABLED=false to disable calls. Missing configuration, refusals, malformed responses, invalid citations, and provider failures preserve the deterministic report.

API implementation reference: https://developers.openai.com/api/docs/guides/structured-outputs (consulted 22 September 2026).

## Validation and outstanding gate

Automated transport tests use mocked Responses API outputs, including fabricated IDs/quotes, failure/refusal/incomplete output, oversized payloads, and the request ceiling. UI markup tests inspect source disclosure, owner confirmation, safe escaping, and empty-result wording. These are implementation tests, not proof of model semantic quality or prompt-injection resistance.

Replay the four existing captured sites to guard deterministic behavior. Before deploying an enabled version, run real model evaluations across retailer, publisher, SaaS, florist, and professional-service pages, with injected instructions and misleading quotations. Review whether each finding is supported, consequential and actionable; zero substantive findings is acceptable. Record model/version, evidence reference, latency and usage. Compare against the deterministic-only report. Browser interaction QA and live provider quality remain outstanding until activation/access.

Current scope is single-page HTML; no JavaScript rendering, external fact verification, multi-model consensus, saved histories, or live AI-search recommendation measurement. Trust and differentiation remain unassessed in the deterministic layer. This milestone does not establish commercial readiness.

## Gemini free-tier pilot update — 23 September 2026

Gemini is now the default provider. Set GEMINI_API_KEY and AIEON_AI_ENABLED=true. The adapter pins gemini-2.5-flash using generateContent, JSON schema output, one candidate, 2,400 output tokens and disabled thinking for a bounded initial pilot. Existing timeout, byte cap, exact-citation validation and request ceiling apply. Truncated, blocked and malformed responses fail closed. No retries or provider fallback occur.

Use a Google AI Studio project on the Free Tier without linked billing. The application cannot verify Google's billing tier; this must be checked in AI Studio. Eligible free usage and quotas are provider-controlled and may change. Never promise that the API key itself guarantees no charges if billing is subsequently linked. Public non-confidential page text only: Google may use free-tier data to improve products. The opt-in disclosure now explains this.

AIEON_AI_PROVIDER=gemini is optional because it is the default. OpenAI requires explicit AIEON_AI_PROVIDER=openai plus its existing key/model settings, and is not authorized for this free pilot. AIEON_AI_MODEL does not override the pinned Gemini model.

Official references consulted: https://ai.google.dev/api/generate-content and https://ai.google.dev/gemini-api/docs/pricing . Transport compatibility is tested with mocked responses; real account access and live model quality still require a scan on Render with the privately configured credential.
