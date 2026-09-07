import type { BusinessQuestion } from "@/components/discovery/mapBusinessProfile";

const STATUS_LABELS = {
  found: "Found on your site",
  partial: "Partially clear",
  missing: "Not identified in checked content",
} as const;

const STATUS_STYLES = {
  found: "border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399]",
  partial: "border-[#FBBF24]/30 bg-[#FBBF24]/10 text-[#FBBF24]",
  missing: "border-white/10 bg-white/[0.03] text-white/40",
} as const;

export default function BusinessQuestionCard({
  question,
  defaultOpen = false,
}: {
  question: BusinessQuestion;
  defaultOpen?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left transition-colors hover:border-white/15">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#D4AF37]">
            {question.sectionTitle}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            {question.question}
          </h3>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLES[question.status]}`}
        >
          {question.assessment === "not-assessed" ? "Not assessed yet" : STATUS_LABELS[question.status]}
        </span>
      </div>

      <p className="text-base leading-relaxed text-white/90">{question.summary}</p>

      {question.details.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
          {question.details.map((detail) => (
            <li
              key={detail}
              className="flex gap-2 text-sm leading-relaxed text-white/70"
            >
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#D4AF37]" />
              {detail}
            </li>
          ))}
        </ul>
      )}

      {((question.howDetermined?.length ?? 0) > 0 || (question.sources?.length ?? 0) > 0) && (
        <details className="mt-4 group" open={defaultOpen}>
          <summary className="cursor-pointer text-sm text-white/50 transition-colors hover:text-white/70">
            How we determined this
          </summary>
          <ul className="mt-3 space-y-2 rounded-xl bg-white/[0.03] p-4">
            {question.howDetermined?.map((step) => (
              <li key={step} className="text-sm leading-relaxed text-white/60">
                {step}
              </li>
            ))}
          </ul>
          {question.sources?.map((source) => (
            <blockquote key={source.observationId} className="mt-3 break-words border-l border-white/20 pl-4 text-sm text-white/60">
              <p>{source.quote}</p>
              <p className="mt-1 text-xs text-white/40">Observed on {source.pageUrl} · {source.sourceType} · {source.selector}</p>
            </blockquote>
          ))}
        </details>
      )}
    </article>
  );
}
