"use server";

import { runInterpretation } from "@/src/interpretation/runInterpretation";
import type { InterpretationResult } from "@/src/interpretation/types";
import { headers } from "next/headers";
import { pilotAccess } from "@/src/server/pilot-access";
import { acquireScanCapacity } from "@/src/core/discovery/ScanCapacity";
import { parsePublicWebsiteUrl, WebsiteFetchError } from "@/src/core/discovery/PublicWebsitePolicy";
import { DiscoveryRunner } from "@/src/core/discovery/DiscoveryRunner";
import type { Observation } from "@/src/types/observation";
import type { ResolvedIdentity } from "@/src/types/resolved-identity";
import type { CrawlCoverage } from "@/src/core/discovery/WebsiteCrawler";

export type DiscoveryResult =
  | { observations: Observation[]; resolvedIdentity: ResolvedIdentity; coverage: CrawlCoverage; interpretation?: InterpretationResult }
  | { error: string };

/**
 * Runs the discovery pipeline for a single URL on the server.
 *
 * Fetching external websites must happen server-side to avoid browser CORS
 * restrictions. Identity interpretation uses deterministic rules only.
 */
export async function runDiscovery(url: unknown, includeInterpretation: unknown = false): Promise<DiscoveryResult> {
  let release: (() => void) | undefined;
  try {
    if (pilotAccess((await headers()).get("authorization")) !== "authorized") {
      return { error: "Sign in to the AiEON private pilot before scanning." };
    }
    const parsed = parsePublicWebsiteUrl(url);
    release = acquireScanCapacity();
    const runner = new DiscoveryRunner();
    const { observations, resolvedIdentity, coverage } = await runner.run(parsed.href);
    const interpretation = includeInterpretation === true ? await runInterpretation(observations) : undefined;
    return { observations, resolvedIdentity, coverage, interpretation };
  } catch (error) {
    return { error: error instanceof WebsiteFetchError
      ? error.message
      : "Something went wrong during discovery. Please try again." };
  } finally { release?.(); }
}
