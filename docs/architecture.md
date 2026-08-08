# AiEON Architecture

This document describes the analysis pipeline from website URL to business understanding, including implemented modules, defined types, and planned layers.

The ten canonical questions that drive this architecture are defined in [business-understanding-framework.md](./business-understanding-framework.md).

## System Overview

AiEON is a layered TypeScript pipeline executed primarily on the server (Next.js App Router). Each layer has a narrow contract and explicit exclusions documented in source comments.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Business Understanding Framework                     │
│         Ten canonical questions (Q1–Q10) → unified report               │
│              See business-understanding-framework.md                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
┌─────────────────────────────────────────────────────────────────────────┐
│                         Business Understanding                          │
│              (future: unified profile, reporting, recommendations)      │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
┌───────────────────────────────────┴───────────────────────────────────┐
│  Report (planned)          Reasoning / Scoring (planned)                │
│  AiEON Index, Ions         framework/ reasoning/ report/ — stubs        │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
┌───────────────────────────────────┴───────────────────────────────────┐
│                         Evidence Layer                                  │
│  EvidenceBuilder → AiEONEvidence (partial V1)                           │
│  DiscoveryEngine → AiEONEvidence (architectural stub, empty defaults)   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
┌───────────────────────────────────┴───────────────────────────────────┐
│                       Interpretation Layer                              │
│  IdentityInterpreter → ResolvedIdentity (Q1 — implemented V1)           │
│  ValueInterpreter, OfferingInterpreter, AudienceInterpreter, … (planned)│
│  One interpreter cluster per framework question group                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
┌───────────────────────────────────┴───────────────────────────────────┐
│                        Discovery Layer                                  │
│  WebsiteFetcher → HtmlParser → Observation[]                            │
│  DiscoveryRunner orchestrates fetch + parse + interpret                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
                              Public URL
```

## Active Pipeline (Wired)

The production dev path is triggered by `runDiscovery()` in `app/discovery/actions.ts` and orchestrated by `DiscoveryRunner`.

```
URL
 │
 ▼
WebsiteFetcher.fetchHtml(url)
 │  • Validates http/https URL
 │  • Native fetch, 15s timeout default
 │  • Returns raw HTML string
 │  • Does not parse HTML
 │
 ▼
HtmlParser.parse(html, pageUrl)
 │  • Cheerio structural extraction
 │  • Version 1 selectors: title, meta[name="description"], first h1
 │  • Returns Observation[]
 │  • Does not interpret or build evidence
 │
 ▼
IdentityInterpreter.interpret(observations)
 │  • Deterministic multi-source identity rules
 │  • Returns ResolvedIdentity with reasoning
 │  • Does not use LLMs or calculate Ions
 │
 ▼
DiscoveryRunResult { observations, resolvedIdentity }
 │
 ▼
app/discovery/page.tsx (internal dev UI)
```

### Structured logging

`DiscoveryRunner` emits JSON log lines:

| Event | When |
|-------|------|
| `fetch_started` | Before HTTP request |
| `fetch_completed` | After HTML received (`htmlLength`) |
| `parsing_started` | Before Cheerio parse |
| `parsing_completed` | After observations built (`observationCount`) |
| `observations_collected` | Summary count |
| `interpretation_started` | Before identity interpretation |
| `interpretation_completed` | After identity resolved (`primaryBrand`, `confidence`) |

## Implemented but Unwired

### EvidenceBuilder

```
Observation[] + pageUrl
        │
        ▼
EvidenceBuilder.build()
        │
        ▼
AiEONEvidence (all dimensions present; V1 populates 3 fields)
```

Version 1 mappings:

| Target field | Rule |
|--------------|------|
| `identity.businessName` | Title text before first `\|` or `-`; empty if no separator |
| `identity.website` | Hostname from `pageUrl` |
| `knowledge.valueProposition` | Verbatim first H1 observation |

Not called by `DiscoveryRunner` or any page today.

### DiscoveryEngine

Architectural stub defining the contract for six-dimension evidence discovery. `discover(url)` runs six private methods in parallel and returns empty `AiEONEvidence`. Comment in source: crawling and extraction not implemented.

## Planned Layers (Stubs)

| Directory | Intended role |
|-----------|---------------|
| `src/core/framework/` | Shared orchestration, plugin interfaces, pipeline composition |
| `src/core/reasoning/` | Ion calculation, confidence aggregation across dimensions |
| `src/core/report/` | Report generation, recommendations, export formats |

These directories contain `.gitkeep` only.

## Core Types

### Observation

Raw, uninterpreted signal from a page.

```typescript
interface Observation {
  id: string;              // "{pageUrl}::{selector}"
  pageUrl: string;
  sourceType: ObservationSourceType;
  selector: string;
  rawValue: string;
  confidence: number;        // 1.0 for direct V1 extractions
  discoveredAt: string;      // ISO 8601
}
```

Defined source types include `heading`, `paragraph`, `metadata`, `schema`, `image`, `link`, `button`, `review`, `faq`. Version 1 extraction uses `metadata` and `heading` only.

### ResolvedIdentity

Interpreted business identity with explicit reasoning.

Key fields: `primaryBrand`, `legalBusinessName`, `tradingName`, `domain`, `websiteTitle`, `candidateNames`, `operatingCountry`, `confidence`, `evidence`, `reasoning`.

Version 1 resolves `primaryBrand` only when ≥2 observations agree on a normalized name.

### AiEONEvidence

Six-dimension evidence container:

| Dimension | Interface | Focus |
|-----------|-----------|-------|
| `identity` | `IdentityEvidence` | Who the business is |
| `knowledge` | `KnowledgeEvidence` | What it offers |
| `trust` | `TrustEvidence` | Credibility signals |
| `authority` | `AuthorityEvidence` | External recognition |
| `conversation` | `ConversationEvidence` | Messaging clarity |
| `action` | `ActionEvidence` | Visitor affordances |

## Module Reference

| Module | Path | Status |
|--------|------|--------|
| `WebsiteFetcher` | `src/core/discovery/WebsiteFetcher.ts` | Implemented |
| `HtmlParser` | `src/core/discovery/HtmlParser.ts` | Implemented (V1 selectors) |
| `DiscoveryRunner` | `src/core/discovery/DiscoveryRunner.ts` | Implemented, wired |
| `IdentityInterpreter` | `src/core/interpreter/IdentityInterpreter.ts` | Implemented (V1 rules) |
| `EvidenceBuilder` | `src/core/evidence/EvidenceBuilder.ts` | Implemented, unwired |
| `DiscoveryEngine` | `src/core/discovery/DiscoveryEngine.ts` | Stub |

## UI Architecture

| Route | Role |
|-------|------|
| `/` | Marketing landing (`Hero`, `WebsiteInput` — input not connected to pipeline) |
| `/discovery` | Internal dev tool; calls `runDiscovery` server action |

Server actions are required for discovery because browser-side fetch to arbitrary URLs would hit CORS restrictions.

## Dependency Graph

```
app/discovery/actions.ts
        └── DiscoveryRunner
                ├── WebsiteFetcher
                ├── HtmlParser
                └── IdentityInterpreter

EvidenceBuilder (standalone)
DiscoveryEngine (standalone)
```

## Extension Points

Documented TODOs in `IdentityInterpreter` for future observation sources:

- JSON-LD Organization
- Footer legal/copyright lines
- Contact page content
- Logo alt text
- Google Business Profile
- LinkedIn company page

Additional `ObservationSourceType` values (`schema`, `link`, etc.) are reserved for these extractors.

## Technology Stack

| Component | Choice |
|-----------|--------|
| Runtime | Next.js 16 App Router, React 19 |
| Language | TypeScript (strict) |
| HTML parsing | Cheerio |
| HTTP | Native `fetch` with `AbortController` timeout |
| Styling | Tailwind CSS 4, design tokens in `design-tokens.ts` |

Path alias: `@/*` maps to project root.

## Framework Question Mapping

| Question | Primary module (current/planned) | Output type |
|----------|----------------------------------|-------------|
| Q1 Who are they? | `IdentityInterpreter` | `ResolvedIdentity` |
| Q2 Value | `EvidenceBuilder` (partial) / `ValueInterpreter` | `KnowledgeEvidence` |
| Q3 Offerings | `OfferingInterpreter` | `KnowledgeEvidence` |
| Q4 Audience | `AudienceInterpreter` | `KnowledgeEvidence`, `ConversationEvidence` |
| Q5 Problems | `ProblemInterpreter` | `KnowledgeEvidence`, `ConversationEvidence` |
| Q6 Differentiation | `DifferentiationInterpreter` | `KnowledgeEvidence`, `ConversationEvidence` |
| Q7 Trust | `TrustInterpreter` | `TrustEvidence` |
| Q8 AI recommendation | `RecommendationInterpreter` | Composite + `ConversationEvidence` |
| Q9 Actions | `ActionInterpreter` | `ActionEvidence` |
| Q10 Authority | `AuthorityInterpreter` | `AuthorityEvidence` |

Full specifications: [business-understanding-framework.md](./business-understanding-framework.md).
