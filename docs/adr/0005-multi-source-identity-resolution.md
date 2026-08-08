# ADR 0005: Multi-Source Identity Resolution

**Status:** Accepted  
**Date:** 2026-08-08

## Context

A single HTML element—typically `<title>`—often contains a brand name mixed with taglines, locations, or SEO keywords (e.g., `"Viva Flora Qatar | Flower Delivery Qatar"`). Treating one DOM node as ground truth for business identity produces false confidence.

AiEON requires identity fields that are defensible under audit, particularly `primaryBrand`, which downstream scoring and reporting will reference.

## Decision

`IdentityInterpreter` resolves `primaryBrand` using **multi-source agreement**:

1. Extract name candidates from all Version 1 sources:
   - Full HTML title text
   - Title prefix before first `|` or `-` (when separator present)
   - First H1 heading text
2. Store all unique candidates in `candidateNames`
3. Normalize candidates (trim + lowercase) for comparison only; display values preserve original casing
4. Assign `primaryBrand` only when **≥2 distinct observation IDs** support the same normalized name
5. Set `confidence` to `1` when primary brand resolved, `0` otherwise—explicitly not an Ion score

Fields requiring explicit evidence remain empty in V1:

- `legalBusinessName`
- `tradingName`
- `operatingCountry`

Every interpretation run appends human-readable steps to `reasoning[]` and lists contributing observation IDs in `evidence[]`.

Future sources (JSON-LD, footer, GBP, LinkedIn) are documented as TODOs in source code, not silently skipped without trace.

## Consequences

### Positive

- Prevents single-element false positives for brand identity
- Users and engineers see *why* a brand was or was not resolved
- Candidate list preserves ambiguous signals for future reconciliation
- Aligns with philosophy: "Multiple independent observations strengthen confidence"

### Negative

- Sites with consistent title but missing/mismatched H1 will not resolve `primaryBrand`
- Normalization is strict (exact lowercase match); typos between title and H1 prevent agreement

### Neutral

- Title-only sites show candidates but empty primary brand—correct per rules, may confuse users until copy explains via `ui-language.md`
- `EvidenceBuilder` uses a different title rule (prefix only for `businessName`); consolidation may be needed

## Alternatives Considered

**Single observation sufficient:** Rejected; violates core philosophy and produces high false-positive rate on SEO titles.

**Fuzzy string matching:** Could increase agreement rate but introduces opaque similarity thresholds; deferred.

**LLM disambiguation:** Rejected for V1 per ADR 0002.

## References

- `src/core/interpreter/IdentityInterpreter.ts`
- `src/types/resolved-identity.ts`
- `docs/philosophy.md` — "Multiple Independent Observations Strengthen Confidence"
- `docs/ui-language.md` — identity confidence messaging
