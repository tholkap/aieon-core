import type { AiUnderstandingReport } from "@/components/how-ai-sees-you/mapAiUnderstanding";

export default function BlindSpotsSection({
  report,
}: {
  report: AiUnderstandingReport;
}) {
  if (report.blindSpots.length === 0) {
    return (
      <section className="rounded-3xl border border-[#34D399]/20 bg-[#34D399]/5 p-8 sm:p-10">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#34D399]">
          AI blind spots
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          No major blind spots detected
        </h2>
        <p className="mt-3 max-w-2xl text-base text-white/60">
          All six core questions returned clear signals from your homepage.
          Continue monitoring as you update content.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#F87171]">
          AI blind spots
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Where AI loses the plot
        </h2>
        <p className="mt-3 max-w-2xl text-base text-white/55">
          These gaps mean AI may omit, misstate, or hesitate when describing
          your business to potential customers.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {report.blindSpots.map((spot) => (
          <article
            key={spot.id}
            className="rounded-2xl border border-[#F87171]/20 bg-[#F87171]/5 p-6"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-[#F87171]/80">
              {spot.question}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              {spot.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              {spot.impact}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
