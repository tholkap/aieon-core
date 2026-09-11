import { WebsiteFetchError } from "./PublicWebsitePolicy";

// Process-level resource guard, not a distributed per-customer billing quota.
let active = 0;
let windowStart = Date.now();
let started = 0;
export function acquireScanCapacity(): () => void {
  const now = Date.now();
  if (now - windowStart >= 60_000) { windowStart = now; started = 0; }
  if (active >= 2 || started >= 20) {
    throw new WebsiteFetchError("Scan capacity is busy. Please try again in a minute.");
  }
  active++;
  started++;
  let released = false;
  return () => { if (!released) { active--; released = true; } };
}
