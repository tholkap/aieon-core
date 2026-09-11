# AiEON launch readiness

## Target

The next release is a private pilot that produces accurate, sourced business understanding and verifies an implemented improvement. Public commercial launch remains blocked until the evidence, security, operations, and customer gates below pass. The hosted frontend preview still contains saved reports, with no live scanner.

## Collector milestone

Implemented on `codex/launch-foundation` after the evidence-report baseline:

- Validate unknown server-action inputs; reject credentials, custom ports, non-HTTP schemes, overlong URLs, and internal hostnames.
- Apply a conservative IPv4/IPv6 public destination policy. Block loopback, private, link-local, metadata, shared, multicast, documentation, mapped and transition ranges.
- Resolve all returned addresses and reject a hostname if any answer is unsafe. Pin a vetted address at connection time using Node HTTP/HTTPS lookup. Retain the original hostname for Host, TLS SNI and normal certificate validation. Do not rely on a second DNS lookup or an ambient proxy.
- Manually validate every redirect, limit redirects to five, detect loops, and reject HTTPS downgrades. No cookies, authorization, or target-supplied headers are forwarded.
- One 15-second deadline covers DNS, connections, redirects and body consumption. Limit HTML bodies to 5 MiB and response headers to 16 KiB. Require HTML MIME types. Request identity encoding and reject compressed responses rather than risk unbounded decompression. This intentionally excludes servers that ignore Accept-Encoding: identity. Decoding currently assumes UTF-8.
- Use the final response URL as the source of extracted observations.
- Return safe errors and log target hostnames rather than complete submitted URLs.
- Limit each process to two simultaneous scans and twenty starts per minute. This is a resource guard, NOT a distributed customer quota or abuse-prevention service.

Verification includes adversarial URL and address cases, mixed DNS answers, connection pinning, redirect rebinding, body limits, timeouts, and safe error handling. Network behavior tests use mocked HTTP response streams; they do not substitute for a deployed egress test or independent security review.

Live website verification from this workspace failed because public host DNS lookup returns EAI_AGAIN. Do not relax the destination policy, route around environment restrictions, or report live benchmarks as passing. Repeat Apple, Walmart, Peninsula Qatar and Qatar Tribune scans on the selected Node hosting environment before enabling scans for customers.

Design references: [OWASP SSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html), [Node HTTP request options](https://nodejs.org/api/http.html#httprequesturl-options-callback), [IANA IPv6 special-purpose registry](https://www.iana.org/assignments/iana-ipv6-special-registry).

## Milestone verification

- Typecheck and Next.js production build pass.
- All 32 tests pass (21 existing semantic/report tests and 11 collector/boundary tests).
- Lint has zero errors and six existing warnings in the unused DiscoveryEngine stub.
- Built application smoke test passes three routes and server-action rejection of invalid protocol, non-string input, metadata IP and credential-bearing URL.
- All four previously captured benchmark reports remain identical apart from replay timestamps.
- Live DNS/connection verification is blocked in this workspace; no claim of public launch readiness.

## Remaining gates, in order

1. **Deployment security:** use a Node runtime supporting the pinned collector (not the static Sites preview); verify TLS, actual socket routing, redirects, real-site compatibility and egress network restrictions. Add persistent per-customer quotas, abuse controls and deployment-wide concurrency limits. Test oversized/pathological HTML and operational resource limits. Decide crawl policy and retention before public release.
2. **Useful understanding:** repair identity corroboration and safe aliases; improve offering extraction across business types; implement audience, trust and differentiation with evidence and counterexamples. Preserve the frozen shared framework.
3. **AI comparison:** establish a versioned evidence snapshot and an independently reviewed AI-only baseline. Add model output validation, evidence citations, inference labels, injection testing, token/cost limits and repeated measurements. Model agreement is not external truth or a ranking guarantee.
4. **Verified improvement:** retain before/after evidence and show which specific findings changed. Keep website changes separate from model variability and do not claim revenue causation.
5. **Pilot operations:** accounts, tenant isolation, saved scans, deletion, monitoring, backups and recovery, support contact, clear scope and a controlled customer cohort.
6. **Commercial release:** pilot evidence of willingness to pay and repeat use; founder-approved offer, pricing and cost budget; payment-provider eligibility and business verification; tested billing/webhooks; privacy/terms reflecting the actual services; final public launch approval.

## Decisions and access

Routine implementation is delegated. No credentials should be pasted into chat or committed to source. Before paid infrastructure is provisioned, present the founder with a concrete provider/configuration and operating-cost proposal. Provider billing, account ownership and business verification require the founder when connectors cannot perform them. Accounts, AI provider integration and billing are not implemented and must not be advertised as available.

## Identity corroboration follow-up

The active identity engine now retains independent title/H1 observations, splits explicit title/tagline separators without breaking hyphenated names, handles Home-first titles, and treats exact website-host variants as aliases rather than competing names. Descriptions no longer become whole organization-name candidates. Duplicate observation IDs cannot supply both title and H1 corroboration. A single candidate with insufficient support is described as tentative, not as several conflicting businesses. No shared framework changes or model calls were introduced.

Saved benchmark replay (same captured HTML, not fresh live scans):

| Website | Previous identity state | Updated result |
|---|---|---|
| Apple | Partially clear | Apple, found from title, H1 and hostname |
| Walmart | Partially clear | Walmart, found from title/H1 prefixes and hostname |
| Qatar Tribune | Partially clear | Qatar Tribune, found from title/H1 prefixes |
| The Peninsula Qatar | Partially clear | The Peninsula Qatar, still partial: title evidence alone |

Eight new identity tests cover corroboration, aliases, taglines, hyphenated brands, generic labels, similar-but-distinct names and duplicate IDs. All 40 tests and typecheck pass; lint has the same six pre-existing warnings. Offering and the other question outputs remain unchanged.

Remaining identity limitations: title/headline names can describe a page topic or product instead of its organization; schema, logo and richer organizational context are still needed. Confidence weights remain heuristics, not probabilities. The legacy server identity interpreter is still separate. Complex domain suffixes/subdomains are deliberately not guessed. This is a bounded correctness improvement, not completion of identity understanding or public-launch approval. The hosted saved-report preview is unchanged.
