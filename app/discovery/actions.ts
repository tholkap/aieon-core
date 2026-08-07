"use server";

import { DiscoveryRunner } from "@/src/core/discovery/DiscoveryRunner";
import type { Observation } from "@/src/types/observation";

export type DiscoveryResult =
  | { observations: Observation[] }
  | { error: string };

/**
 * Runs the raw discovery pipeline for a single URL on the server.
 *
 * Fetching external websites must happen server-side to avoid browser CORS
 * restrictions. No evidence, Ions, or AI processing is applied.
 */
export async function runDiscovery(url: string): Promise<DiscoveryResult> {
  const trimmed = url.trim();

  if (!trimmed) {
    return { error: "Please enter a website URL." };
  }

  try {
    const runner = new DiscoveryRunner();
    const observations = await runner.run(trimmed);
    return { observations };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong during discovery. Please try again.";

    return { error: message };
  }
}
