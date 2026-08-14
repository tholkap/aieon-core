import type {
  AiUnderstandingReport,
  ReadinessLevel,
} from "@/components/how-ai-sees-you/mapAiUnderstanding";

const LEVEL_CONFIG: Record<
  ReadinessLevel,
  { ring: string; text: string; description: string }
> = {
  strong: {
    ring: "stroke-[#34D399]",
    text: "text-[#34D399]",
    description:
      "AI can describe your business with confidence. You are well-positioned for AI-driven discovery and recommendations.",
  },
  moderate: {
    ring: "stroke-[#FBBF24]",
    text: "text-[#FBBF24]",
    description:
      "AI grasps the basics but may leave out important details. Strengthening partial areas will improve how you appear in AI answers.",
  },
  weak: {
    ring: "stroke-[#FB923C]",
    text: "text-[#FB923C]",
    description:
      "AI would struggle to represent you accurately. Competitors with clearer messaging may be favored in AI recommendations.",
  },
  critical: {
    ring: "stroke-[#F87171]",
    text: "text-[#F87171]",
    description:
      "Your public site does not give AI enough to work with. Urgent content improvements are needed before AI can meaningfully recommend you.",
  },
};

function ScoreRing({ score, level }: { score: number; level: ReadinessLevel }) {
  const config = LEVEL_CONFIG[level];
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative mx-auto h-36 w-36 sm:mx-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          className={config.ring}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${config.text}`}>{score}</span>
        <span className="text-xs text-white/40">/ 100</span>
      </div>
    </div>
  );
}

export default function ReadinessSummary({
  report,
}: {
  report: AiUnderstandingReport;
}) {
  const config = LEVEL_CONFIG[report.readinessLevel];

  return (
    <section className="rounded-3xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-transparent p-8 sm:p-10">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
        AI readiness
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        How ready you are for AI discovery
      </h2>

      <div className="mt-8 flex flex-col items-center gap-8 sm:flex-row sm:items-center">
        <ScoreRing score={report.readinessScore} level={report.readinessLevel} />
        <div className="flex-1 text-center sm:text-left">
          <p className={`text-xl font-semibold ${config.text}`}>
            {report.readinessLabel}
          </p>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-white/65">
            {config.description}
          </p>
          <ul className="mt-6 space-y-2 text-sm text-white/50">
            <li>
              <span className="text-white/70">Clear signals:</span>{" "}
              {report.stats.clear} of 6 questions
            </li>
            <li>
              <span className="text-white/70">Blind spots:</span>{" "}
              {report.blindSpots.length} area
              {report.blindSpots.length === 1 ? "" : "s"}
            </li>
            <li>
              <span className="text-white/70">Action items:</span>{" "}
              {report.recommendations.length} recommendation
              {report.recommendations.length === 1 ? "" : "s"}
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
