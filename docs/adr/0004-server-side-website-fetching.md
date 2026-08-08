# ADR 0004: Server-Side Website Fetching

**Status:** Accepted  
**Date:** 2026-08-08

## Context

The discovery pipeline must download HTML from arbitrary public URLs. Two execution environments exist in the Next.js application:

1. **Browser (client components)** — subject to CORS; cannot reliably fetch third-party origins
2. **Server (Server Actions, Route Handlers, server components)** — no CORS restriction; full Node.js fetch available

The `/discovery` page requires user-triggered analysis of user-supplied URLs.

## Decision

All website fetching runs **server-side**:

- `WebsiteFetcher` uses native `fetch` with `AbortController` timeout (default 15s)
- `runDiscovery()` in `app/discovery/actions.ts` is a Server Action marked `"use server"`
- The Server Action instantiates `DiscoveryRunner`, which calls `WebsiteFetcher.fetchHtml()`
- The client page receives serialized `Observation[]` and `ResolvedIdentity` only—never raw fetch from the browser

`WebsiteFetcher` validates URLs (http/https only), rejects non-200 responses, and surfaces network/timeout errors to the caller.

## Consequences

### Positive

- Works for any publicly accessible URL without CORS configuration
- Fetch credentials, timeouts, and headers controlled in one server module
- HTML never exposed to client unless explicitly returned for debugging (not done in V1)

### Negative

- Server egress bandwidth and latency borne by AiEON infrastructure
- Requires abuse protections (rate limiting, URL blocklists) before public beta
- Server Actions add serialization constraints on return types

### Neutral

- Future caching layer should sit alongside `WebsiteFetcher`, not in the client
- JavaScript-rendered SPAs may return shell HTML; handling deferred to Observation Expansion milestone

## Alternatives Considered

**Client-side fetch with CORS proxy:** Adds proxy infrastructure and security risk; rejected.

**API Route instead of Server Action:** Equivalent for V1; Server Action chosen for simpler form integration in App Router.

**Headless browser (Puppeteer/Playwright):** Required for JS-heavy sites but adds cost and complexity; not in Foundation scope.

## References

- `src/core/discovery/WebsiteFetcher.ts`
- `app/discovery/actions.ts`
- `app/discovery/page.tsx`
