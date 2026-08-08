# Architecture Decision Records

Architecture Decision Records (ADRs) document significant technical decisions in AiEON. Each record captures context, the decision made, and consequences for future work.

## Format

| Field | Description |
|-------|-------------|
| **Status** | Proposed, Accepted, Deprecated, Superseded |
| **Date** | When the decision was recorded |
| **Context** | Problem and constraints |
| **Decision** | What was decided |
| **Consequences** | Positive, negative, and neutral outcomes |

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [0001](./0001-observation-first-data-model.md) | Observation-first data model | Accepted |
| [0002](./0002-deterministic-interpretation-before-ai.md) | Deterministic interpretation before AI | Accepted |
| [0003](./0003-separated-discovery-interpreter-evidence-layers.md) | Separated discovery, interpreter, and evidence layers | Accepted |
| [0004](./0004-server-side-website-fetching.md) | Server-side website fetching | Accepted |
| [0005](./0005-multi-source-identity-resolution.md) | Multi-source identity resolution | Accepted |
| [0006](./0006-six-dimension-evidence-model.md) | Six-dimension evidence model | Accepted |

## Adding a New ADR

1. Copy the template from any existing ADR.
2. Assign the next sequential number (`0007`, etc.).
3. Set status to `Proposed` until reviewed, then `Accepted`.
4. Update this index.
5. Link from `architecture.md` if the decision affects the pipeline diagram.
