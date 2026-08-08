# ADR 0001: Observation-First Data Model

**Status:** Accepted  
**Date:** 2026-08-08

## Context

AiEON analyzes public websites to understand businesses. A common failure mode in analysis systems is collapsing fetch, parse, interpret, and score into a single step—producing output that cannot be audited or corrected when wrong.

We need a primitive data type that:

- Captures exactly what was found on a page
- Records where it was found (URL, selector, source type)
- Carries no semantic meaning beyond structural category
- Can be consumed by multiple downstream interpreters and evidence mappers

## Decision

Introduce `Observation` as the atomic unit of discovery output (`src/types/observation.ts`).

Each observation contains:

- `id` — stable identifier (`{pageUrl}::{selector}`)
- `pageUrl` — page where the value was extracted
- `sourceType` — structural category (`heading`, `metadata`, `schema`, etc.)
- `selector` — CSS selector locating the source element
- `rawValue` — unprocessed extracted text
- `confidence` — extraction certainty (1.0 for direct DOM reads in V1)
- `discoveredAt` — ISO 8601 timestamp

`HtmlParser` produces `Observation[]` and performs no interpretation. Downstream modules (`IdentityInterpreter`, `EvidenceBuilder`) consume observations as read-only input.

## Consequences

### Positive

- Full audit trail from displayed conclusions back to page elements
- Multiple interpreters can run on the same observation set without re-fetching
- New extractors add observations without changing interpreter contracts
- `/discovery` dev tool can display raw observations alongside interpreted output

### Negative

- Additional serialization and storage compared to direct field mapping
- Observation arrays may grow large with multi-page crawling (future concern)

### Neutral

- `ObservationSourceType` includes types not yet extracted (`review`, `faq`, etc.) to reserve the vocabulary
- Observation confidence is distinct from identity or Ion confidence

## Alternatives Considered

**Direct mapping in parser:** HtmlParser returns `AiEONEvidence` directly. Rejected because interpretation rules would be embedded in extraction, violating separation of concerns.

**Unstructured key-value store:** Flexible but loses source provenance and selector traceability.

## References

- `src/types/observation.ts`
- `src/core/discovery/HtmlParser.ts`
- `docs/philosophy.md` — "Observation Before Interpretation"
