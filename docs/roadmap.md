# AiEON Roadmap

Milestones from Foundation through Public Beta. Each milestone has explicit engineering deliverables and exit criteria. Dates are intentionally omitted; progress is tracked by capability, not calendar.

Framework question coverage is defined in [business-understanding-framework.md](./business-understanding-framework.md). Milestones below reference questions by number (Q1–Q10).

---

## Milestone 1: Foundation

**Goal:** Establish the core data model, discovery transport, and an internal pipeline validation surface.

### Deliverables

| Item | Status |
|------|--------|
| `Observation` type and Version 1 HTML extraction | Done |
| `WebsiteFetcher` with URL validation, timeout, error handling | Done |
| `HtmlParser` (title, meta description, first H1) | Done |
| `DiscoveryRunner` orchestration and structured logging | Done |
| `ResolvedIdentity` type and `IdentityInterpreter` V1 | Done |
| `AiEONEvidence` type definitions (six dimensions) | Done |
| `EvidenceBuilder` V1 (3 fields) | Done, not wired |
| `/discovery` internal dev page | Done |
| `DiscoveryEngine` architectural stub | Done |

### Exit criteria

- [x] Engineer can enter a URL on `/discovery` and inspect observations plus resolved identity
- [x] Every resolved identity field is empty or traceable to observations and rules
- [x] No LLM calls in the discovery or interpretation path
- [ ] `EvidenceBuilder` integrated into `DiscoveryRunner`
- [ ] Design tokens consumed by UI components (currently hardcoded Tailwind)

---

## Milestone 2: Observation Expansion

**Goal:** Increase observation coverage and source diversity without adding interpretation complexity.

**Framework impact:** Expands evidence sources for Q1–Q10 (especially Q1, Q3, Q7, Q9, Q10).

### Deliverables

- Additional `HtmlParser` selectors: paragraphs, links, buttons, images (alt text), FAQ blocks
- JSON-LD `Organization` and `WebSite` schema extraction (`sourceType: schema`)
- Footer and contact page observation extractors
- Multi-page fetch strategy (homepage + `/about`, `/contact`, common paths)
- Observation deduplication and normalization utilities
- Extend `/discovery` to display observation counts by `sourceType`

### Exit criteria

- [ ] ≥10 distinct observation types extracted on a representative sample of business sites
- [ ] JSON-LD observations appear when present; absent when not (no fallback invention)
- [ ] Identity interpreter TODOs for JSON-LD, footer, contact, logo implemented or explicitly deferred with ADR

---

## Milestone 3: Evidence Population

**Goal:** Wire evidence building into the pipeline and populate all six dimensions from observations.

**Framework impact:** Implement interpreters for Q2–Q7, Q9, Q10; partial Q8 readiness assessment.

### Deliverables

- Integrate `EvidenceBuilder` into `DiscoveryRunner` (or replace with dimension-specific builders)
- Implement `DiscoveryEngine` discover methods using real extractors
- Evidence mapping rules documented per field (similar to identity reasoning)
- Evidence gap report: which fields are populated vs empty for a given URL
- `/discovery` evidence inspection panel (or separate `/evidence` dev route)

### Exit criteria

- [ ] `AiEONEvidence` returned alongside `observations` and `resolvedIdentity`
- [ ] Every populated evidence field links to supporting observation IDs
- [ ] Empty fields documented in a reasoning or gap structure
- [ ] No field populated by LLM in this milestone

---

## Milestone 4: External Reconciliation

**Goal:** Cross-reference on-site observations with external listings.

### Deliverables

- Google Business Profile observation adapter (read-only public data)
- LinkedIn company page observation adapter
- Reconciliation rules in `IdentityInterpreter` (and future interpreters)
- Conflict detection when external name ≠ on-site primary brand
- `candidateNames` enriched from external sources

### Exit criteria

- [ ] External sources are optional inputs; pipeline succeeds without them
- [ ] Conflicts surfaced in reasoning, not silently resolved
- [ ] Legal business name populated only when explicit evidence exists across sources

---

## Milestone 5: Reasoning and Scoring

**Goal:** Introduce Ion metrics and AiEON Index with full traceability.

**Framework impact:** Q8 fully scored; composite recommendation-readiness from Q1–Q7 and Q10 evidence.

### Deliverables

- Implement `src/core/reasoning/` modules
- Identity Ion, Understanding Ion, Trust Ion, Authority Ion — each derived from evidence completeness and consistency
- ConversAiEON layer (conversation evidence quality metrics)
- AiEON Index composite with documented weighting
- Scoring ADR documenting formulas and thresholds
- Prohibit scoring when mandatory evidence dimensions are empty

### Exit criteria

- [ ] Every score decomposes to evidence fields and rules (no opaque model output)
- [ ] `/discovery` or dedicated tool shows score breakdown
- [ ] `AnalysisProgress` steps correspond to real pipeline stages

---

## Milestone 6: Reporting and Framework

**Goal:** Production-ready orchestration and user-facing output.

**Framework impact:** User report renders all ten questions using labels from `ui-language.md`.

### Deliverables

- `src/core/report/` report generator (structured JSON + rendered HTML/PDF)
- `src/core/framework/` pipeline composer (configure stages, plugins)
- Connect landing page `WebsiteInput` to analysis flow
- User-facing results page with business-friendly language (see `ui-language.md`)
- Rate limiting, caching, and error recovery for fetch layer
- Authentication and analysis history (if required for beta)

### Exit criteria

- [ ] End user can submit URL from `/` and receive a complete report
- [ ] Report cites observations and evidence for every claim
- [ ] Pipeline runs within defined latency and cost budgets

---

## Milestone 7: Public Beta

**Goal:** Limited public release with monitoring, feedback, and documented limitations.

### Deliverables

- Public beta deployment (hosting, domain, SSL)
- Observability: fetch success rate, parse coverage, identity resolution rate
- Known limitations document (supported site types, language coverage, JS-rendered pages)
- Feedback channel for incorrect identity or evidence mappings
- Privacy and data retention policy for fetched URLs and stored observations

### Exit criteria

- [ ] Beta users can analyze URLs without engineer intervention
- [ ] SLOs defined for availability and analysis completion time
- [ ] Regression suite covers top N business site templates
- [ ] All scoring and recommendations traceable via `/discovery`-equivalent audit view

---

## Dependency Graph Between Milestones

```
Foundation
    └── Observation Expansion
            └── Evidence Population
                    └── External Reconciliation
                            └── Reasoning and Scoring
                                    └── Reporting and Framework
                                            └── Public Beta
```

Milestones are sequential in dependency but some work can overlap (e.g., design token adoption during Foundation cleanup).
