import type { AiUnderstandingReport } from "@/components/how-ai-sees-you/mapAiUnderstanding";

const PRIORITY_STYLES = {
  high: "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]",
  medium: "border-white/15 bg-white/[0.04] text-white/60",
} as const;

export default function RecommendationsSection({
  report,
}: {
  report: AiUnderstandingReport;
}) {
  if (report.recommendations.length === 0) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">
          Recommended improvements
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Your homepage is in good shape
        </h2>
        <p className="mt-3 max-w-2xl text-base text-white/60">
          No urgent content gaps were identified. Focus on keeping messaging
          consistent as you grow.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
          Recommended improvements
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          What to fix first
        </h2>
        <p className="mt-3 max-w-2xl text-base text-white/55">
          Practical steps to help AI — and humans — understand and recommend
          you with confidence.
        </p>
      </header>

      <ol className="space-y-4">
        {report.recommendations.map((rec, index) => (
          <li
            key={rec.id}
            className="flex gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:items-start"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-sm font-semibold text-[#D4AF37]">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold text-white">{rec.title}</h3>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${PRIORITY_STYLES[rec.priority]}`}
                >
                  {rec.priority} priority
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {rec.description}
              </p>
              <p className="mt-3 text-xs text-white/35">
                Addresses: {rec.relatedQuestion}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
