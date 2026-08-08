# AiEON Vision

## Mission

AiEON exists to answer ten canonical questions about any business well enough that AI systems can understand, compare, and recommend it without guessing.

Those questions—defined in [business-understanding-framework.md](./business-understanding-framework.md)—cover identity, value, offerings, audience, problems, differentiation, trust, recommendation-readiness, action pathways, and authority. AiEON collects public web signals, interprets them with explicit rules, and assembles evidence-backed answers that humans can audit.

The immediate engineering goal is not a single score or generated summary. It is a reliable pipeline from raw page content to defensible business understanding.

## Problem Statement

AI assistants recommend businesses they believe they understand. When identity, value proposition, or trust signals are ambiguous or inconsistent, recommendation quality degrades—even when the underlying business is strong.

Fragmentation is the core problem:

- Identity appears differently in title tags, headings, structured data, and external listings
- Value and offerings are spread across hero copy, product pages, and FAQs
- Trust and authority signals are optional and inconsistently published

AiEON addresses this by:

1. **Collecting** raw observations without premature interpretation
2. **Interpreting** observations through deterministic, question-specific rules
3. **Assembling** structured evidence mapped to the ten framework questions
4. **Measuring** confidence only after evidence exists—not before

## Long-Term Vision

AiEON becomes the reference layer for how a business presents itself to AI: a verifiable profile where every answer traces to observations and reasoning.

### Target state

| Capability | Framework questions served |
|------------|---------------------------|
| Multi-page discovery | All (broader evidence sources) |
| Cross-source reconciliation | Q1, Q7, Q8 |
| Full evidence population | Q1–Q10 via `AiEONEvidence` |
| Explainable scoring | Q8 via Ions and AiEON Index |
| Actionable reporting | All — gap analysis per question |

### What AiEON is not

- **Not a content generator.** Answers come from observed sources, not invented prose.
- **Not a black-box classifier.** Decisions must be traceable to observations and rules.
- **Not a replacement for human judgment.** Output is input to review and improvement.

## Success Criteria

Progress is measured by framework coverage and pipeline integrity:

- Each of the ten questions has a defined interpreter contract (specified; most not yet implemented)
- Every populated field traces to observations or explicit empty defaults
- Interpretation produces human-readable reasoning
- Confidence increases only when independent observations converge
- The `/discovery` dev tool reflects the same pipeline as production analysis

## Current State (Foundation)

| Framework question | Status |
|--------------------|--------|
| Q1 Who are they? | Partial — `IdentityInterpreter` V1 |
| Q2–Q10 | Specified; evidence types defined; interpreters not implemented |

Implemented infrastructure:

- `WebsiteFetcher`, `HtmlParser`, `DiscoveryRunner`
- `IdentityInterpreter`, `EvidenceBuilder` (partial, unwired)
- `AiEONEvidence` six-dimension schema
- `/discovery` internal validation page

Scoring (Ions, AiEON Index), multi-page crawling, and full evidence population remain on the roadmap.
