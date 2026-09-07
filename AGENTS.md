<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## AiEON engineering rules

- Read `docs/current-state-2026-09-07.md` for the inspected runtime map and remaining blockers. Older architecture documents describe earlier milestones.
- Preserve working code and the deterministic evidence pipeline. Freeze `src/questions/shared`; introduce shared abstractions only when two independent engines demonstrate the same need.
- Keep identity, offerings, audience, trust, differentiation, and actions distinct. Preserve observation provenance and disclose inference and coverage limits.
- An unimplemented check is not evidence that a website is missing information. Do not publish arbitrary readiness scores or claim frontier AI testing that has not run.
- Validate changes with `npm run typecheck`, `npm test`, `npm run build`, `npm run lint`, and the relevant benchmarks. `npm run smoke` checks the built server; `npm run smoke -- --live` adds live discovery.
- The founder delegates routine engineering decisions. Work in reviewable increments; ask for product decisions or genuinely irreversible actions, not compiler fixes.
