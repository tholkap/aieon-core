"use client";

import { type FormEvent, useMemo, useState } from "react";

import { runDiscovery } from "@/app/discovery/actions";
import BusinessProfileReport from "@/components/discovery/BusinessProfileReport";
import DeveloperView from "@/components/discovery/DeveloperView";
import { mapDiscoveryToBusinessProfile } from "@/components/discovery/mapBusinessProfile";
import type { Observation } from "@/src/types/observation";
import type { ResolvedIdentity } from "@/src/types/resolved-identity";

export default function DiscoveryV2Page() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [resolvedIdentity, setResolvedIdentity] =
    useState<ResolvedIdentity | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const profile = useMemo(() => {
    if (!hasRun || !resolvedIdentity || error) {
      return null;
    }

    return mapDiscoveryToBusinessProfile(url, observations, resolvedIdentity);
  }, [hasRun, resolvedIdentity, error, url, observations]);

  async function handleScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError(null);
    setObservations([]);
    setResolvedIdentity(null);

    const result = await runDiscovery(url);

    setHasRun(true);

    if ("error" in result) {
      setError(result.error);
    } else {
      setObservations(result.observations);
      setResolvedIdentity(result.resolvedIdentity);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#081426] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 sm:px-10">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
              AiEON <span className="text-[#D4AF37]">•</span> Discovery V2
            </p>
            <h1 className="mt-1 text-lg font-semibold">Business Understanding</h1>
          </div>
          <p className="hidden text-sm text-white/40 sm:block">
            For founders, marketers &amp; AI optimization teams
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 sm:px-10 sm:py-16">
        <section className="mb-16 text-center sm:text-left">
          <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            See how clearly AI can understand a business from its website
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/60">
            Enter any public website. AiEON scans the homepage and answers six
            questions investors, customers, and AI assistants ask before they
            recommend you.
          </p>

          <form
            onSubmit={handleScan}
            className="mt-10 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center"
          >
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://yourcompany.com"
              disabled={loading}
              className="h-14 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-base text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#D4AF37]/40 disabled:opacity-50 sm:rounded-full sm:px-6"
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="h-14 shrink-0 rounded-2xl bg-[#D4AF37] px-8 text-base font-medium text-[#081426] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-full"
            >
              {loading ? "Scanning…" : "Scan website"}
            </button>
          </form>
        </section>

        {loading && (
          <div
            className="mb-16 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-8"
            aria-live="polite"
          >
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/5 animate-pulse rounded-full bg-[#D4AF37]" />
            </div>
            <p className="text-sm text-white/50">
              Scanning your website and building your business understanding
              report…
            </p>
          </div>
        )}

        {error && (
          <div
            className="mb-16 rounded-2xl border border-[#F87171]/30 bg-[#F87171]/10 px-6 py-4 text-sm text-[#F87171]"
            role="alert"
          >
            {error}
          </div>
        )}

        {profile && resolvedIdentity && (
          <div className="space-y-12">
            <BusinessProfileReport profile={profile} />
            <DeveloperView
              observations={observations}
              identity={resolvedIdentity}
            />
          </div>
        )}

        {!loading && hasRun && !error && !profile && (
          <p className="text-center text-sm text-white/40">
            No report could be generated for this URL.
          </p>
        )}

        {!hasRun && !loading && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Who are they?",
              "What do they do?",
              "Who do they help?",
              "Why trust them?",
              "Why choose them?",
              "What should the visitor do next?",
            ].map((question) => (
              <div
                key={question}
                className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-left"
              >
                <p className="text-sm font-medium text-white/70">{question}</p>
                <p className="mt-2 text-xs text-white/30">
                  Scan a website to see the answer
                </p>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
