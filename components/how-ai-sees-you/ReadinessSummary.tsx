import type { AiUnderstandingReport } from "@/components/how-ai-sees-you/mapAiUnderstanding";

export default function ReadinessSummary({ report }: { report: AiUnderstandingReport }) {
  return (
    <section className="rounded-3xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-transparent p-8 sm:p-10">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">Scope of this report</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">What was checked</h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/65">
        Identity, offering descriptions, and customer action wording: {report.stats.assessed} of six questions.
        Audience, trust, and differentiation are not assessed yet.
      </p>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/55">
        This scan reads the requested page&apos;s HTML, without running the website&apos;s JavaScript
        or visiting other pages. The current offering rules cover limited English descriptions.
        A signal not identified here may still exist elsewhere on your site or fall outside these checks.
      </p>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/55">
        No AI visibility score or recommendation prediction is produced. Frontier AI comparison has not been run.
      </p>
    </section>
  );
}
