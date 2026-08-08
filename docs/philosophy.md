# AiEON Engineering Philosophy

These principles govern implementation decisions across discovery, interpretation, evidence, and scoring. They are constraints, not aspirations—code that violates them should not merge.

## 1. Observation Before Interpretation

Raw facts come first. An **observation** is an unmodified value extracted from a page together with its source location (selector, source type, page URL, timestamp).

Interpretation layers consume observations. They do not fetch pages, parse HTML, or mutate observation records.

**Implication:** `HtmlParser` emits `Observation[]`. `IdentityInterpreter` reads observations; it does not call Cheerio or fetch URLs.

## 2. Evidence Before Confidence

**Evidence** is structured data mapped from observations according to documented rules. **Confidence** reflects how well-supported a conclusion is—not the other way around.

Empty evidence fields remain empty. Confidence is not used to fill gaps.

**Implication:** `EvidenceBuilder` and `IdentityInterpreter` leave fields blank when rules do not apply. `ResolvedIdentity.confidence` is `1` only when a primary brand is supported by multiple observations; it is not an Ion score.

## 3. Explainability Before Scoring

Every interpreted field should be reconstructable from:

1. The observations that contributed
2. The rules that were applied
3. A reasoning log describing the outcome

Scoring (Ions, AiEON Index) is deferred until evidence and reasoning are in place. UI progress labels for Ions exist in `AnalysisProgress.tsx` but no scoring logic is implemented.

**Implication:** `ResolvedIdentity.reasoning` is a first-class output, not debug metadata.

## 4. Never Hallucinate

If a value is not present in source material and no explicit rule extracts it, the system returns an empty string or empty array.

Prohibited behaviors:

- Inferring legal business names without explicit evidence (e.g., JSON-LD `Organization.legalName`, footer registration line)
- Assuming operating country from domain TLD or page language
- Generating value propositions when no H1 observation exists
- Using LLMs to fill missing evidence fields

**Implication:** Version 1 `IdentityInterpreter` sets `legalBusinessName`, `tradingName`, and `operatingCountry` to empty strings with documented reasoning explaining why.

## 5. Multiple Independent Observations Strengthen Confidence

A conclusion derived from a single DOM element is a candidate, not a resolved identity.

`IdentityInterpreter` assigns `primaryBrand` only when at least two distinct observations support the same normalized name (e.g., title prefix and H1 heading agree). One observation alone is insufficient regardless of extraction confidence.

**Implication:** Observation-level confidence (`1.0` for direct DOM reads) is separate from identity resolution confidence.

## 6. Deterministic Rules First

Version 1 pipelines use deterministic string operations, selector matching, and counting—no LLMs, no embeddings, no fuzzy matching.

When AI is introduced later, it must operate on already-collected evidence and observations, produce reasoning, and never be the sole source for a required field.

## 7. Separation of Concerns

| Layer | Responsibility | Must not |
|-------|----------------|----------|
| Transport | Download HTML | Parse or interpret |
| Discovery | Extract observations | Map to evidence or score |
| Interpretation | Resolve structured profiles from observations | Fetch pages or invent values |
| Evidence | Map observations to dimension fields | Calculate Ions |
| Reasoning / Scoring | Measure and report (future) | Fetch or parse |

## 8. Fail Open on Absence, Fail Closed on Error

Missing page elements are normal—skip silently and continue. Network failures, invalid URLs, timeouts, and non-200 responses throw and surface errors to the caller.

**Implication:** `HtmlParser` omits observations for missing selectors. `WebsiteFetcher` rejects bad requests rather than returning partial HTML.

## 9. Internal Validation Before User-Facing Analysis

The `/discovery` dev tool runs the same server-side pipeline as production analysis will use. Engineers validate observations and resolved identity before exposing scores or recommendations to end users.

## 10. Question-Driven Architecture

All discovery, interpretation, and evidence work serves the ten canonical questions in [business-understanding-framework.md](./business-understanding-framework.md). New modules must declare which question(s) they answer and which evidence fields they populate.

Do not add extractors or interpreters that do not map to a framework question without updating the framework document first.

## Principle Checklist for New Code

Before adding a module or rule, confirm:

- [ ] Does it operate on observations or evidence, not raw HTML (unless it is a fetcher/parser)?
- [ ] Can every output field be explained without referencing model weights or prompts?
- [ ] Are empty outputs preferred over guessed values?
- [ ] Does confidence require independent corroboration where identity is concerned?
- [ ] Is AI optional and downstream, not a dependency for core fields?
