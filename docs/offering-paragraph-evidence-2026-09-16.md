# Offering body-copy coverage — 16 September 2026

## Outcome

A business that explicitly describes its offering in a body paragraph can now receive a sourced, tentative answer instead of being missed because its title and H1 only name the brand. Example: “We provide accounting services for small businesses.” remains a verbatim website statement, not independent verification.

## Scope

- Add a structural paragraph observation, preserving page URL, original paragraph index, raw text and observation ID.
- Collect at most 200 eligible paragraphs, each at most 2,000 characters. Skip rather than truncate oversized paragraphs.
- Exclude marked articles, quotations, navigation, header/footer/sidebar, dialogs, templates, and explicitly hidden regions. Template document fragments are excluded even when the HTML parser does not retain a normal ancestor chain.
- Select only short English first-person statements beginning with We provide/offer/sell/manufacture/specialize in. Paragraph-only findings remain partial. Questions, quoted wording, denials and future intentions covered by the rules are excluded.
- Deduplicate repeated paragraph wording before ranking. Reuse the existing supporting-copy weight, 15; this is a heuristic, not a calibrated probability. No readiness score is introduced.
- Preserve the shared question framework and existing identity behavior. Paragraphs are consumed as raw observation fallback; no new semantic zone is invented from their tag alone.

## Evaluation

Six authored business fixtures (retailer, manufacturer, professional services, university, hospitality, publisher) exercise the newly supported body-only descriptions. Additional tests check excluded regions, hidden ancestors, template fragments, negation, questions, repetition, collection limits, and actual customer report markup/provenance. Existing tests cover nine business models overall.

Same-capture replay of Apple, Walmart, The Peninsula Qatar and Qatar Tribune verifies all six customer report cards remain identical. Raw observation counts increase because additional body copy is retained. This establishes regression stability, **not improved catalog understanding on those four websites**. Apple and Walmart catalog coverage remains unfinished.

Fresh scans were attempted on all four websites; all returned the collector's secure-connection failure. These attempts are not passing live benchmarks. Production egress validation remains a launch blocker.

Verification: all 51 tests, type checking, production build and production-server smoke checks pass. Lint has zero errors and six pre-existing warnings in the unused DiscoveryEngine stub. Customer markup and source disclosure were inspected through the rendered-report test; no interactive browser QA was performed.

## Limits and next step

This is a bounded coverage improvement, not a full offering engine or industry benchmark win. Third-person descriptions, product grids, structured data, other languages and rendered JavaScript remain outside this change. CSS stylesheet visibility and speaker attribution in unmarked quotations cannot be established from this static extraction. Excluding article elements can miss legitimate marketing copy inside those elements. Existing metadata/H1 heuristics retain their earlier limitations.

Next: extract product/category evidence with source context, then benchmark useful offering coverage and false positives across additional real businesses. Frontier-model and competing-product comparisons have not been run. No main-branch merge, preview redeployment, public launch, or paid service activation is included.
