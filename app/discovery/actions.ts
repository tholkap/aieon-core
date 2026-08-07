"use server";

import { DiscoveryRunner } from "@/src/core/discovery/DiscoveryRunner";
import type { Observation } from "@/src/types/observation";
import type { ResolvedIdentity } from "@/src/types/resolved-identity";

export type DiscoveryResult =
  | { observations: Observation[]; resolvedIdentity: ResolvedIdentity }
  | { error: string };

/**
 * Runs the discovery pipeline for a single URL on the server.
 *
 * Fetching external websites must happen server-side to avoid browser CORS
 * restrictions. Identity interpretation uses deterministic rules only.
 */
export async function runDiscovery(url: string): Promise<DiscoveryResult> {
  const trimmed = url.trim();

  if (!trimmed) {
    return { error: "Please enter a website URL." };
  }

  try {
    const runner = new DiscoveryRunner();
    const { observations, resolvedIdentity } = await runner.run(trimmed);
    return { observations, resolvedIdentity };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong during discovery. Please try again.";

    return { error: message };
  }
}
