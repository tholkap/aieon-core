"use client";

import { type FormEvent, useState } from "react";

import { runDiscovery } from "@/app/discovery/actions";
import DeveloperView from "@/components/discovery/DeveloperView";
import AiUnderstandingReportView from "@/components/how-ai-sees-you/AiUnderstandingReport";
import HeroSection from "@/components/how-ai-sees-you/HeroSection";
import PreviewGrid from "@/components/how-ai-sees-you/PreviewGrid";
import { mapDiscoveryToAiUnderstanding, type AiUnderstandingReport } from "@/components/how-ai-sees-you/mapAiUnderstanding";
import type { Observation } from "@/src/types/observation";
import type { ResolvedIdentity } from "@/src/types/resolved-identity";

export default function HowAiSeesYouPage() {
  const [includeInterpretation, setIncludeInterpretation] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [resolvedIdentity, setResolvedIdentity] =
    useState<ResolvedIdentity | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const [report, setReport] = useState<AiUnderstandingReport | null>(null);

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedUrl = url.trim();

    setLoading(true);
    setError(null);
    setObservations([]);
    setResolvedIdentity(null);
    setReport(null);

    try {
      const result = await runDiscovery(submittedUrl, includeInterpretation);
      if ("error" in result) {
        setError(result.error);
      } else {
        setObservations(result.observations);
        setResolvedIdentity(result.resolvedIdentity);
        setReport({ ...mapDiscoveryToAiUnderstanding(submittedUrl, result.observations, result.resolvedIdentity), interpretation: result.interpretation });
      }
    } catch {
      setError("The scan could not be completed. Please try again.");
    } finally {
      setHasRun(true);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#081426] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
              AiEON
            </p>
            <p className="mt-1 text-sm text-white/70">How AI Sees You</p>
          </div>
          <a
            href="/discovery"
            className="text-sm text-white/40 transition-colors hover:text-white/70"
          >
            Discovery Lab →
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 sm:px-10 sm:py-16">
        <HeroSection
          url={url}
          loading={loading}
          onUrlChange={setUrl}
          onSubmit={handleAnalyze}
        />

        <label className="mt-6 flex items-start gap-3 text-sm text-white/65">
          <input type="checkbox" checked={includeInterpretation} disabled={loading} onChange={(event) => setIncludeInterpretation(event.target.checked)} className="mt-1" />
          <span>Include AI interpretation (pilot). When activated, selected public-page text is sent to the configured AI provider (Google Gemini for this pilot) to suggest improvements. Google may use free-tier content to improve its products. Use public, non-confidential pages only. Suggestions require your review.</span>
        </label>

        {loading && (
          <div
            className="mt-12 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-8"
            aria-live="polite"
          >
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-[#D4AF37]" />
            </div>
            <p className="text-sm text-white/50">
              Reading your public page and building your business understanding
              report…
            </p>
          </div>
        )}

        {error && (
          <div
            className="mt-12 rounded-2xl border border-[#F87171]/30 bg-[#F87171]/10 px-6 py-4 text-sm text-[#F87171]"
            role="alert"
          >
            {error}
          </div>
        )}

        {report && resolvedIdentity && (
          <div className="mt-16 space-y-16">
            <AiUnderstandingReportView report={report} />
            <DeveloperView
              observations={observations}
              identity={resolvedIdentity}
            />
          </div>
        )}

        {!loading && hasRun && !error && !report && (
          <p className="mt-12 text-center text-sm text-white/40">
            No report could be generated for this URL.
          </p>
        )}

        {!hasRun && !loading && (
          <div className="mt-16">
            <PreviewGrid />
          </div>
        )}
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-8 sm:px-10">
          <p className="text-center text-xs text-white/30">
            Based on the requested page&apos;s HTML only. Findings are limited to
            AiEON&apos;s current checks. No frontier AI comparison has been run.
          </p>
        </div>
      </footer>
    </div>
  );
}
