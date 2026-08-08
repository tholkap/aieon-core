# ADR 0002: Deterministic Interpretation Before AI

**Status:** Accepted  
**Date:** 2026-08-08

## Context

Business identity extraction can be performed by LLMs, heuristics, or explicit rules. LLMs produce fluent output but introduce non-determinism, hallucination risk, and weak auditability. AiEON's core value proposition depends on explainable analysis.

The Foundation milestone must deliver a pipeline that engineers can validate without model variance or API dependencies.

## Decision

Version 1 interpretation and evidence mapping use **deterministic rules only**:

- String operations (split on `|`, `-`; trim; lowercase normalization for comparison)
- Selector-based DOM extraction via Cheerio
- Counting distinct observation IDs that support a normalized value
- Explicit empty defaults when rules do not apply

LLMs are excluded from:

- `WebsiteFetcher`
- `HtmlParser`
- `IdentityInterpreter`
- `EvidenceBuilder`
- `DiscoveryRunner`

Source comments in each module explicitly state "does not invoke AI models."

When AI is introduced (post-Foundation), it must:

1. Operate on existing observations or evidence, not replace fetch/parse
2. Produce reasoning alongside any generated content
3. Never be the sole source for required identity or evidence fields

## Consequences

### Positive

- Reproducible results for the same URL and HTML
- No LLM API cost or latency in the core path
- Unit tests can assert exact outputs without mocking models
- `/discovery` displays reasoning strings engineers can verify manually

### Negative

- Cannot infer legal names, countries, or nuanced positioning without explicit extractors
- Title/H1 agreement may miss valid brands when site copy is inconsistent

### Neutral

- `AnalysisProgress.tsx` lists Ion steps for future UX; no scoring logic exists yet
- AI may be added in a separate `reasoning/` layer per roadmap Milestone 5

## Alternatives Considered

**LLM-first extraction:** Faster to populate fields but violates "Never hallucinate" principle and produces un-auditable output.

**Hybrid with LLM fallback:** Tempting for empty fields. Rejected for V1 because fallback would mask missing extractors and encourage invented values.

## References

- `src/core/interpreter/IdentityInterpreter.ts`
- `src/core/evidence/EvidenceBuilder.ts`
- `docs/philosophy.md` — "Never Hallucinate", "Deterministic Rules First"
