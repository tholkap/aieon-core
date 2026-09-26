# Crawl review — 25 September 2026

PR #9 follow-up bounds sitemap fetches to 10 and retained page discoveries to 2,000. Existing 25 attempted-page and per-request transport limits remain. Root links are queued before sitemap entries. Content query parameters are preserved; only utm_*, gclid, fbclid and msclkid are removed. Redirect aliases are parsed and counted once per final URL; requests still consume the attempt budget. Coverage reports discovery truncation and duplicate responses explicitly.

Validation: 93 tests pass, including chained sitemap bounds, root-link priority, content query provenance and redirect deduplication. Typecheck, production build and both protected/unconfigured server smoke checks pass. Lint has zero errors and seven existing warnings. Four saved HTML benchmarks replay successfully; they are single-page regression checks, not fresh multi-page accuracy validation. Shared Question Engine files are unchanged.

Not deployment-ready: robots policy, a cancellable whole-scan deadline, aggregate byte/observation budgets, sitemap XML structure handling, relevant-page prioritization beyond root links, and live multi-page semantic evaluation remain. Current request counts are finite, but worst-case scans can still be slow. Generic recommendations with appended quotations are not yet the actionable diagnosis milestone. No whole-site completeness or commercial-readiness claim is justified. No deployment performed.


## Follow-up: scan budgets and robots

Added a 60-second cancellable scan deadline, a 20 MiB streamed download budget,
50 transport-request attempts including redirects, and a 10,000-observation cap.
Partial results disclose the stop reason and retain the already-read homepage.
robots-parser 3.0.1 evaluates AiEON rules before every content request, including
redirect targets; robots checks share transport security and scan budgets.
Robots 404/410 mean absent; all other retrieval failures conservatively block
content collection. Crawl-delay is honored within the deadline. Rules are cached
only within a scan. Unsupported/oversized robots responses fail closed. This is
not an assessment of whether any particular frontier provider can access a site.

99 tests pass, typecheck/build pass, lint has six pre-existing warnings, and both
production smoke modes pass. Saved single-page benchmarks replay successfully.
Live crawl attempts in this workspace were blocked; direct DNS lookup returned
EAI_AGAIN. No live semantic-quality pass is claimed. A bounded, read-only three-site
crawl benchmark now runs on pushes to this PR branch in GitHub Actions, printing
coverage, question summaries, source excerpts and recommendations for review.
Passing that command demonstrates collection, not recommendation quality.

Remaining release gates: inspect live results, improve sitemap structure handling
and page prioritization where coverage warrants it, test real customer-facing
reports, and replace generic advice with supported page-specific diagnoses.
No merge or deployment is included in this follow-up.
