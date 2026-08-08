# ADR 0003: Separated Discovery, Interpreter, and Evidence Layers

**Status:** Accepted  
**Date:** 2026-08-08

## Context

AiEON transforms a URL into business understanding through several transformations: download HTML, extract observations, interpret identity, map evidence, and (eventually) score and report.

Monolithic "analyzer" classes tend to accrete responsibilities, making testing and iteration difficult. Different layers also have different failure modes and deployment constraints (e.g., fetch must run server-side).

## Decision

Organize the pipeline into distinct layers under `src/core/`:

| Layer | Directory | Input → Output |
|-------|-----------|----------------|
| Discovery (transport + extraction) | `discovery/` | URL → HTML → `Observation[]` |
| Interpretation | `interpreter/` | `Observation[]` → `ResolvedIdentity` (and future profiles) |
| Evidence | `evidence/` | `Observation[]` → `AiEONEvidence` |
| Reasoning (planned) | `reasoning/` | Evidence → scores |
| Report (planned) | `report/` | Evidence + scores → report |
| Framework (planned) | `framework/` | Pipeline composition |

`DiscoveryRunner` orchestrates discovery and interpretation only—it does not call `EvidenceBuilder` in the current wired path.

`DiscoveryEngine` exists as a separate architectural stub for six-dimension parallel discovery, returning empty evidence until implemented.

Each class documents what it **must not** do (parse HTML in interpreter, fetch in parser, score in evidence builder).

## Consequences

### Positive

- Layers can be tested and versioned independently
- Evidence mapping can evolve without changing HTML extractors
- Multiple interpreters (knowledge, trust) can be added alongside `IdentityInterpreter`
- Clear import boundaries reduce circular dependencies

### Negative

- Orchestration code (`DiscoveryRunner`, future `framework/`) required to wire layers
- Temporary duplication: both `EvidenceBuilder` and `DiscoveryEngine` target `AiEONEvidence` with different maturity levels

### Neutral

- `EvidenceBuilder` is implemented but unwired; integration deferred to Milestone 3
- Two paths to evidence (`EvidenceBuilder` vs `DiscoveryEngine`) will need consolidation ADR when `DiscoveryEngine` is implemented

## Alternatives Considered

**Single `Analyzer` class:** Simpler initially but already showing strain between stub `DiscoveryEngine` and working `DiscoveryRunner`.

**Evidence inside interpreter:** Would couple identity resolution to six-dimension schema changes.

## References

- `src/core/discovery/DiscoveryRunner.ts`
- `src/core/interpreter/IdentityInterpreter.ts`
- `src/core/evidence/EvidenceBuilder.ts`
- `src/core/discovery/DiscoveryEngine.ts`
- `docs/architecture.md`
