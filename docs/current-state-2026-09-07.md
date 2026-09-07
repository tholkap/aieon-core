# AiEON: inspected state and first engineering milestone

Inspected baseline: `6af2dedc43d5ec69b3bdac1a5ccb9e6638d8d425` on `main`.
Runtime: Next.js 16.3.0 / Turbopack, React 19.2.8, TypeScript, Cheerio; validated locally with Node 24.19.0.
This is an existing, functioning deterministic prototype. It is not ready for an unrestricted public launch.

## Current state

The application fetches one requested page, extracts HTML observations, and builds a six-question report. It does not render the target site's JavaScript or crawl additional pages. No frontier-model API is called.

The main discovery path is server-side, but most report interpretation runs on the client. At baseline, only the identity Question Engine was wired into the customer report. The offering engine existed but was unused there. This milestone connects it and explicitly marks the three unimplemented questions as unassessed.

| Runtime stage | Actual implementation and role |
|---|---|
| Entry | `/` now redirects to `/how-ai-sees-you`; previously its Analyze button had no handler. `/discovery` is a public diagnostic route. |
| Transport | `app/discovery/actions.ts` → `DiscoveryRunner` → `WebsiteFetcher.fetchHtml`. HTTP/HTTPS validation and a 15-second timeout exist. |
| Extraction | `HtmlParser`: title, meta description, first H1, all H2/H3, navigation links, footer links, buttons, list items. |
| Legacy identity | `IdentityInterpreter` runs on the server and returns a separate identity profile. |
| Context | `createQuestionEngineContext` → `extractContentZones` → `src/evidence/EvidenceBuilder`. |
| Report identity | `WhoAreTheyQuestionEngine`: extract, normalize, rank, confidence, blind spots, recommendations. It does not simply reuse the server's identity conclusion. |
| Report offering | `WhatDoTheyOfferQuestionEngine`: now connected, with description filtering, real observation references, and explicitly tentative matching labels. |
| Audience / trust / differentiation | Dedicated folders contain placeholders. Now shown as **Not assessed yet**. Previously audience was always missing, trust checked a source the parser never produced, and differentiation listed arbitrary headings. |
| Actions | Report mapper checks explicit action wording. It does not validate destinations or transactions. Ordinary navigation is excluded. |
| Presentation | `mapAiUnderstanding` and report components. Unsupported score and AI predictions removed; source excerpts added under explanation disclosure. |

## What is strong

- Working URL-to-observation pipeline, strict TypeScript, and a successful production build.
- Raw observations carry a page URL, source type, selector, ID, timestamp, and value.
- Existing engine contracts separate evidence, reasoning, confidence, blind spots, and recommendations.
- The report and diagnostic view can reuse the same discovery result.
- No LLM dependency is needed for the deterministic foundation.

## What is broken or semantically weak

- Identity has two implementations with different conclusions. The Question Engine drops an H1 when it matches the hero brand text, even when title and H1 are distinct observations. Domain aliases and entire descriptions can appear as competing names. This milestone deliberately leaves identity resolution unchanged; it needs its own regression work.
- Structural extraction is not semantic understanding. H2 becomes “hero” regardless of location; H3 becomes supporting copy. There is no actual section boundary model.
- Body paragraphs, ordinary anchors, JSON-LD, OpenGraph, image labels, and real trust content are not extracted. Product/schema types in the type union are future capabilities, not working extractors.
- Structured WebsiteEvidence stores values without observation IDs. The old offering extractor invented `website-evidence::...` references that could not be resolved to raw observations. This milestone uses actual observations for offering claims and disclosure.
- Offering rules remain conservative English heuristics, not a complete classifier. Matching navigation/heading labels are clues, not verified product or service classifications. Walmart's catalog is still not understood.
- Actions describe wording only. Some legitimate purchase links are missed because ordinary body anchors are not extracted.

## What was misleading, and what changed

- A weighted average of `found=100`, `partial=55`, and `missing=0` was displayed as an AI readiness score. Two questions were guaranteed to be missing and differentiation could never be found. That score and its severity tiers are removed.
- Report copy predicted whether AI would recommend a business without testing any AI system. It now describes AiEON's own findings and scope.
- Unimplemented checks were presented as customer website deficiencies and generated recommendations. They now remain visible as unassessed, excluded from gap counts and recommendations.
- Offering could be a brand, slogan, generic H1, or CTA. The active report now calls the offering engine; quoted descriptions need descriptive evidence, while matching labels stay partial.
- Every list item was treated as a product by the unused offering catalog. That behavior is removed. Missing products/services no longer automatically generates irrelevant recommendations for every business.
- Report URL and timestamp changed when the user edited the input after a scan. The completed report is now tied to the submitted URL and extraction timestamp; transport exceptions release the loading state.

## Live benchmarks and same-content replay

All four sites were fetched through the application's WebsiteFetcher. The same captured HTML was replayed after the changes. These are results from the captured response, not claims about all content or all regional variants of these sites.

| Site | Observations | Before: offering | After: offering | Remaining limitation |
|---|---:|---|---|---|
| Apple | 304 | “Apple”, found | “Possible offerings named on this page: iPhone.”, partial | Broader catalog coverage is still missing. |
| Walmart | 72 | Brand/slogan, found | Quotes the site's membership/delivery/shipping description, partial | Still lacks a useful retail catalog description. |
| The Peninsula Qatar | 244 | News description, partial | Preserves that news description with source references, partial | Audience/trust/differentiation have not been assessed. |
| Qatar Tribune | 28 | “Qatar Tribune - Homepage”, found | Quotes its news-updates description, partial | Sparse extracted content and no recognized action wording. |

Apple's previous 78 “action pathways” included brand and navigation labels. They are no longer counted as verified pathways. Identity remains partial for all four; this is a known engine limitation, not proof that these brands are unclear.

Captured HTML SHA-256 values:

| Site | SHA-256 |
|---|---|
| Apple | `f5c89de736caa91a264e694e0aa51d78ffa0d8a661606d3597d740c6109a22fa` |
| Walmart | `a4898ee75cf8b6b424c1d2eade2e9d65d0144d85292c7e6ca0eda742dfc49d5d` |
| The Peninsula | `cd0e54d17aa5a7018e63e723c22efe0c3eefb2baa70e4e77f2808cefe6bd6697` |
| Qatar Tribune | `6de59091bd16ec1f8767b938033e264be05cb004eae48c01b0abec6208fb8ea0` |

Full captured third-party pages are not committed. The benchmark script supports local capture and replay with URL/hash validation. Authored test fixtures cover nine business models, plus negative cases for unsupported claims and provenance.

## Architecture and product risks

- Unused paths: `src/core/evidence/EvidenceBuilder`, `DiscoveryEngine`, `BusinessUnderstandingInterpreter`; `src/core/framework`, `reasoning`, and `report` are placeholders. `src/evidence/EvidenceBuilder` is active. These similarly named paths must not be mistaken for the same pipeline.
- Two identity implementations, legacy adapters, and string-only structured evidence can drift. The shared Question Engine framework remains frozen; repair concrete engine behavior before generalizing.
- Confidence is a heuristic support measure, not a calibrated probability. Some rules reward repeated wording; independent pages, conflicts, coverage, and negative evidence are not adequately modeled.
- Source signals are observed; business conclusions are derived. Full claim-level `observed / derived / AI-interpreted / external / unverified` provenance is not implemented yet. On-site statements are not independent verification.
- More cautious output is necessary for trust, but is not yet the desired customer “aha” moment. The next intelligence work must increase useful coverage without restoring false positives.

## Security and production blockers

1. **SSRF:** private, loopback, link-local, and metadata destinations are not blocked. DNS resolution is not validated/pinned; redirects are followed automatically. URL protocol validation alone is insufficient.
2. No response-size cap, content-type enforcement, controlled redirect limit, per-user rate limit, scan quota, or concurrency budget. The 15-second timeout does not address all resource abuse.
3. Server action input validation assumes a string; logs include the submitted URL. Public diagnostic output, error disclosure, URL privacy, retention, robots policy, and monitoring need decisions and implementation before launch.
4. No accounts, tenant isolation, saved scans, billing, or usage economics exist. None should be implied by the current interface.
5. Dependency audit initially flagged transitive `nanoid` 3.3.17. It was updated within its existing dependency range to 3.3.18. The subsequent production dependency audit reported zero advisories; that is not a security audit of the application.

No public deployment or main-branch merge is part of this milestone.

## Deterministic + frontier AI feasibility

The existing observation and QuestionAnalysis structures are sufficient to begin designing a comparison seam later; a rewrite or knowledge graph is unnecessary. The next prerequisite is a versioned, provenance-preserving evidence snapshot that both layers consume. Provider calls, budgets, timeouts, caching, and schema validation belong on the server. Model output must cite observation IDs, preserve unsupported inferences separately, and never replace the deterministic facts. Crawled content must remain untrusted data, unable to override model instructions. Agreement between models is not external factual verification, and no frontier validation was performed in this milestone.

## Top five priorities

1. Secure the fetch boundary with public-destination enforcement at connection time, redirect validation, byte/content limits, input validation, and abuse controls.
2. Fix identity corroboration and aliases using exact, explicit rules; avoid fuzzy entity merging.
3. Expand extraction and retain provenance: real content regions, descriptive paragraphs, link targets, and JSON-LD. Improve offering coverage using that evidence.
4. Implement audience, trust, and differentiation one engine at a time; distinguish website claims from independently verified proof.
5. Establish versioned benchmark expectations and CI gates for supported facts, false positives, coverage, and customer output. Add frontier comparison only after those baselines are dependable.

**Next build milestone:** a secure, bounded website collector, verified with adversarial URL/redirect/response tests and the existing cross-business report regressions. Then repair identity and expand offering evidence. No new shared framework is required.

## Verification and operating commands

```bash
npm ci
npm run typecheck
npm test
npm run lint
npm run build
npm run smoke
npm run smoke -- --live
npm run benchmark -- --capture /tmp/aieon-capture
npm run benchmark -- --replay /tmp/aieon-capture
```

- 21 regression tests pass: nine business models, semantic counterexamples, real observation references, duplicate-source handling, unassessed states, action wording, and rendered HTML escaping/disclosure.
- Production build and typecheck pass. Lint has zero errors and six pre-existing unused-parameter warnings in the unused DiscoveryEngine stub.
- Running production server tested through HTTP: three routes, homepage redirect, invalid protocol handling, and a live Apple discovery via the built server action.
- Browser interaction and visual QA remain unverified: the cloud browser could not reach the isolated local server. Server-rendered report markup was inspected by tests; this does not replace browser interaction testing.
- No frontier-model API comparison or competitive-market research was performed; neither was needed to identify the current wiring and evidence failures.
