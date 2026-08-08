# ADR 0006: Six-Dimension Evidence Model

**Status:** Accepted  
**Date:** 2026-08-08

## Context

Business understanding is multidimensional. A site may communicate its product clearly (knowledge) while lacking trust signals (reviews, policies) or authority markers (awards, publications). A flat key-value profile cannot express these distinctions or support dimension-specific scoring.

AiEON needs a typed schema that:

- Covers the major facets AI assistants infer when recommending businesses
- Allows partial population (most sites will not fill every field)
- Supports future Ion metrics tied to specific dimensions
- Remains stable as extractors are added incrementally

## Decision

Define `AiEONEvidence` as a root container with six sub-interfaces (`src/types/evidence.ts`):

| Dimension | Interface | Purpose |
|-----------|-----------|---------|
| Identity | `IdentityEvidence` | Legal and brand identity, contact surfaces |
| Knowledge | `KnowledgeEvidence` | Products, services, positioning, delivery |
| Trust | `TrustEvidence` | Reviews, policies, transparency, freshness |
| Authority | `AuthorityEvidence` | External recognition, publications, awards |
| Conversation | `ConversationEvidence` | Messaging clarity, audience fit, CTA clarity |
| Action | `ActionEvidence` | Conversion and engagement affordances |

Each interface is fully specified with typed fields (strings and string arrays). Empty defaults are valid—missing data is not an error.

Two implementation paths exist:

1. **`EvidenceBuilder`** — maps `Observation[]` to `AiEONEvidence` with Version 1 rules (3 fields populated)
2. **`DiscoveryEngine`** — architectural stub running six parallel `discover*` methods, returning empty evidence until implemented

Planned scoring maps to these dimensions:

- Identity Ion → `identity`
- Understanding Ion → `knowledge` (+ conversation)
- Trust Ion → `trust`
- Authority Ion → `authority`
- ConversAiEON → `conversation`
- AiEON Index → composite across dimensions

## Consequences

### Positive

- Schema documents the full target state while allowing incremental implementation
- Dimension boundaries prevent conflating trust signals with identity fields
- Parallel discovery in `DiscoveryEngine` matches independent dimension evolution
- UI progress steps in `AnalysisProgress.tsx` align with dimension names

### Negative

- Large type surface area with mostly empty fields in early milestones
- Risk of field overlap between dimensions (e.g., `problemsSolved` in both `KnowledgeEvidence` and `ConversationEvidence`) requiring mapping discipline

### Neutral

- `EvidenceBuilder` and `DiscoveryEngine` duplication temporary until Milestone 3 consolidation
- `ActionEvidence` uses verb-named fields (`buy`, `book`, `contact`) rather than arrays—suited for signal summaries

## Alternatives Considered

**Flat evidence object:** Simpler JSON but no dimension grouping for scoring or partial reports.

**OpenAPI/JSON Schema only:** Less ergonomic for TypeScript pipeline; typed interfaces chosen for compile-time safety.

**Fewer dimensions:** Four or five dimensions omit actionable pathways (`action`) or messaging quality (`conversation`), both relevant to AI recommendation behavior.

## References

- `src/types/evidence.ts`
- `src/core/evidence/EvidenceBuilder.ts`
- `src/core/discovery/DiscoveryEngine.ts`
- `components/AnalysisProgress.tsx` — Ion step labels
- `docs/roadmap.md` — Milestone 3 Evidence Population
