"use client";

import { type FormEvent, useState } from "react";

import { runDiscovery } from "@/app/discovery/actions";
import type { Observation } from "@/src/types/observation";
import type { ResolvedIdentity } from "@/src/types/resolved-identity";

function EmptyValue() {
  return <span className="text-white/30">—</span>;
}

function IdentityField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-white/50">
        {label}
      </dt>
      <dd className="text-base leading-relaxed text-white">
        {value || <EmptyValue />}
      </dd>
    </div>
  );
}

function ResolvedIdentitySection({
  identity,
}: {
  identity: ResolvedIdentity;
}) {
  return (
    <section className="mb-12 flex w-full flex-col gap-4 text-left">
      <h2 className="text-center text-sm font-medium uppercase tracking-wider text-white/50">
        Resolved Identity
      </h2>

      <article className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <dl className="flex flex-col gap-4">
          <IdentityField label="Primary Brand" value={identity.primaryBrand} />
          <IdentityField
            label="Legal Business Name"
            value={identity.legalBusinessName}
          />
          <IdentityField label="Trading Name" value={identity.tradingName} />
          <IdentityField label="Website Title" value={identity.websiteTitle} />
          <IdentityField label="Domain" value={identity.domain} />

          <div>
            <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-white/50">
              Candidate Names
            </dt>
            <dd className="text-base leading-relaxed text-white">
              {identity.candidateNames.length > 0 ? (
                <ul className="list-inside list-disc space-y-1">
                  {identity.candidateNames.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              ) : (
                <EmptyValue />
              )}
            </dd>
          </div>

          <IdentityField
            label="Operating Country"
            value={identity.operatingCountry}
          />

          <div>
            <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-white/50">
              Confidence
            </dt>
            <dd className="font-mono text-sm text-white/80">
              {identity.confidence}
            </dd>
          </div>

          <div>
            <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-white/50">
              Evidence
            </dt>
            <dd className="text-base leading-relaxed text-white">
              {identity.evidence.length > 0 ? (
                <ul className="list-inside list-disc space-y-1 font-mono text-sm text-white/80">
                  {identity.evidence.map((id) => (
                    <li key={id} className="break-all">
                      {id}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyValue />
              )}
            </dd>
          </div>

          <div>
            <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-white/50">
              Reasoning
            </dt>
            <dd className="text-base leading-relaxed text-white">
              {identity.reasoning.length > 0 ? (
                <ul className="list-inside list-disc space-y-2 text-sm text-white/80">
                  {identity.reasoning.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              ) : (
                <EmptyValue />
              )}
            </dd>
          </div>
        </dl>
      </article>
    </section>
  );
}

function ObservationCard({ observation }: { observation: Observation }) {
  return (
    <article className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left">
      <dl className="flex flex-col gap-4">
        <div>
          <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-white/50">
            Source Type
          </dt>
          <dd className="font-mono text-sm text-[#D4AF37]">
            {observation.sourceType}
          </dd>
        </div>

        <div>
          <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-white/50">
            Selector
          </dt>
          <dd className="break-all font-mono text-sm text-white/80">
            {observation.selector}
          </dd>
        </div>

        <div>
          <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-white/50">
            Raw Value
          </dt>
          <dd className="text-base leading-relaxed text-white">
            {observation.rawValue}
          </dd>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-white/50">
              Confidence
            </dt>
            <dd className="font-mono text-sm text-white/80">
              {observation.confidence}
            </dd>
          </div>

          <div>
            <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-white/50">
              Page URL
            </dt>
            <dd className="break-all text-sm text-white/60">
              {observation.pageUrl}
            </dd>
          </div>
        </div>
      </dl>
    </article>
  );
}

export default function DiscoveryPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [resolvedIdentity, setResolvedIdentity] =
    useState<ResolvedIdentity | null>(null);
  const [hasRun, setHasRun] = useState(false);

  async function handleDiscover(event: FormEvent<HTMLFormElement>) {
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
    <div className="flex min-h-screen flex-col bg-[#081426] text-white">
      <main className="flex flex-1 flex-col items-center px-6 py-20 sm:px-10 lg:px-16">
        <div className="flex w-full max-w-2xl flex-col items-center text-center">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-white/50">
            Internal Dev Tool
          </p>

          <h1 className="mb-4 text-[2rem] font-semibold leading-tight tracking-[-0.02em] sm:text-[2.5rem]">
            AiEON Discovery
          </h1>

          <p className="mb-12 max-w-md text-base leading-relaxed text-white/60">
            Validate the discovery pipeline — fetch HTML, interpret identity,
            and inspect raw observations before any evidence or Ion processing.
          </p>

          <form
            onSubmit={handleDiscover}
            className="mb-12 flex w-full max-w-lg flex-col gap-4 sm:flex-row sm:items-center sm:gap-3"
          >
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              disabled={loading}
              className="h-14 w-full flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-6 text-base text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#D4AF37]/40 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50 sm:h-16 sm:rounded-full sm:px-8"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-14 shrink-0 rounded-2xl bg-[#D4AF37] px-10 text-base font-medium text-[#081426] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-16 sm:rounded-full sm:px-12"
            >
              {loading ? "Discovering…" : "Discover"}
            </button>
          </form>

          {loading && (
            <div
              className="mb-12 flex w-full max-w-lg flex-col items-center gap-4"
              aria-live="polite"
            >
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-[#D4AF37]" />
              </div>
              <p className="text-sm text-white/50">
                Fetching HTML, extracting observations, and interpreting
                identity…
              </p>
            </div>
          )}

          {error && (
            <div
              className="mb-12 w-full max-w-lg rounded-2xl border border-[#F87171]/30 bg-[#F87171]/10 px-6 py-4 text-left text-sm text-[#F87171]"
              role="alert"
            >
              {error}
            </div>
          )}

          {!loading && hasRun && !error && resolvedIdentity && (
            <ResolvedIdentitySection identity={resolvedIdentity} />
          )}

          {!loading && observations.length > 0 && (
            <section className="flex w-full flex-col gap-4 text-left">
              <h2 className="text-center text-sm font-medium uppercase tracking-wider text-white/50">
                {observations.length}{" "}
                {observations.length === 1 ? "Observation" : "Observations"}
              </h2>

              <div className="flex flex-col gap-4">
                {observations.map((observation) => (
                  <ObservationCard
                    key={observation.id}
                    observation={observation}
                  />
                ))}
              </div>
            </section>
          )}

          {!loading && hasRun && !error && observations.length === 0 && (
            <p className="text-sm text-white/40">
              No observations found on this page.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
