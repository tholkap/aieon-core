# Founder-only live pilot

This branch is a private test deployment, not a public SaaS launch. The six-question report still has unassessed dimensions. No frontier comparison has been run.

## Render configuration

- Node web service; Free compute for founder testing only.
- Branch: codex/protected-pilot-deployment
- Root directory: blank.
- Build: `npm ci --include=dev && npm test && npm run typecheck && npm run lint && npm run build && npm run smoke && npm run smoke -- --unconfigured`
- Start: `npm run start -- --hostname 0.0.0.0`
- PORT: 10000
- NODE_VERSION: 24.19.0
- NODE_ENV: production
- NEXT_TELEMETRY_DISABLED: 1
- AIEON_PILOT_USERNAME: founder
- AIEON_PILOT_PASSWORD: generate a unique random 32–64 character alphanumeric password in a password manager; enter only in Render's secret environment settings.
- Advanced health check path: /api/health
- Disable automatic deployment for the founder pilot; deploy only reviewed commits.

Do not put the password in source control, URLs, chat messages, or screenshots. Use the host's HTTPS URL. Browser Basic authentication prompts for the username and password. Rotate the environment password and redeploy to revoke it. This shared founder credential is not suitable for customer accounts or teams.

All requests pass through a password gate, except GET/HEAD health checks. The scan server action independently checks authorization before URL validation or network work. Missing or invalid server configuration returns 503 rather than allowing anonymous scans. Only explicit local development permits access without configured credentials.

The health route reports configuration readiness only; it does not prove external website connectivity. Existing process-level scan limits remain single-instance limits.

## Release validation

CI runs tests, types, lint, build, authenticated server smoke checks, unauthorized-route/action rejection and missing-configuration rejection. Smoke credentials are generated ephemerally and override host credentials only in the child test server.

After deployment, verify HTTPS, anonymous rejection, successful founder login, assets and client interaction. Scan Apple, Walmart, a news publisher and a service business; distinguish access/collection failures from missing business evidence. Capture the actual customer reports and examine semantic quality. No claim of production readiness follows from CI alone.

Free hosting can sleep and has resource limits. No paid upgrade is authorized by this document.

Build tools are development dependencies. Keep NODE_ENV=production and explicitly include development dependencies during installation; otherwise npm can omit Tailwind, TypeScript and the test runner.
