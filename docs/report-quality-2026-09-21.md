# Report quality milestone — 21 September 2026

## Delivered

- Audience is now an active deterministic question, with original observation IDs, page URLs, selectors and verbatim quotes in the customer report.
- Explicit first-person audience statements are supported. Recognized offering-for-audience headings remain partial. Navigation labels, marked article/quote regions, negations and hypothetical statements do not become audience facts.
- Confidence is rule support, not a calibrated truth probability; repeated copy does not increase it.
- Offering descriptions now reject questions, quoted claims and common hypothetical/future wording.
- Shared Question Engine files are unchanged.

## Validation

75 tests pass, including positive audience examples across accounting, education, hospitality, software and manufacturing and negative cases for articles, quotations, hidden text and ordinary navigation. Production build and type checking pass. Lint has zero errors and six existing DiscoveryEngine unused-variable warnings.

Replay benchmarks use the previously captured HTML, not fresh live crawls. Apple, Walmart, The Peninsula Qatar and Qatar Tribune retain their previous identity, offering and action outputs. Audience is now assessed, but no supported audience statement is identified in these snapshots. This is not proof of missing audience content on their websites. Trust and differentiation remain unassessed.

Known semantic weaknesses remain: Apple's offering result lists only iPhone; Walmart's page description emphasizes membership/delivery instead of a useful catalog summary. Do not market this milestone as improved accuracy across those sites.

## Commercial release gates

1. Offering coverage: identify product/service evidence across varied business models, retain exact sources and label inferred categories separately. Publish before/after evaluation, including false positives.
2. Complete trust and differentiation checks with meaningful negative cases and clear distinction between website claims and verified evidence.
3. Add saved scans and before/after comparison with customer authentication and data isolation; replace founder-only Basic authentication before customer self-service.
4. Validate production abuse controls, operational monitoring, failure recovery, privacy/retention and support flows. Current capacity limiting is process-local.
5. Run a supervised customer pilot: owners can recognize their business, understand evidence, implement a justified change and verify the rescan. Establish costs and customer willingness to pay before billing or a commercial launch claim.

Frontier-model comparison is not implemented. No cross-model consensus or competitive superiority has been demonstrated. Deployment to the existing private pilot is separate from committing this milestone.
