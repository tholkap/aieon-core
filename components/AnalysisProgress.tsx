"use client";

import { useEffect, useState } from "react";

export const DEFAULT_ANALYSIS_STEPS = [
  "Understanding your business",
  "Identifying your brand",
  "Extracting products & services",
  "Measuring Identity Ion™",
  "Measuring Understanding Ion™",
  "Measuring Trust Ion™",
  "Evaluating Authority Ion™",
  "Building ConversAiEON™",
  "Calculating AiEON Index™",
  "Preparing recommendations",
] as const;

type AnalysisProgressProps = {
  steps?: readonly string[];
  durationMs?: number;
  onComplete?: () => void;
};

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M3 8.5L6.5 12L13 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

export default function AnalysisProgress({
  steps = DEFAULT_ANALYSIS_STEPS,
  durationMs = 8000,
  onComplete,
}: AnalysisProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const next = Math.min((elapsed / durationMs) * 100, 100);
      setProgress(next);

      if (next < 100) {
        frame = requestAnimationFrame(tick);
      } else {
        onComplete?.();
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, onComplete]);

  const completedCount = Math.min(
    Math.floor((progress / 100) * steps.length),
    steps.length,
  );
  const currentStepIndex =
    completedCount < steps.length ? completedCount : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#081426] px-6 py-20 text-white">
      <div className="flex w-full max-w-md flex-col items-center gap-12">
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-white/50">Analyzing</span>
            <span className="tabular-nums text-white/50">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#D4AF37] transition-[width] duration-150 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <ul className="flex w-full flex-col gap-4" aria-live="polite">
          {steps.map((step, index) => {
            const isComplete = index < completedCount;
            const isCurrent = index === currentStepIndex;

            return (
              <li
                key={step}
                className={`flex items-center gap-3 text-sm sm:text-base ${
                  isComplete
                    ? "text-[#34D399]"
                    : isCurrent
                      ? "animate-pulse text-[#D4AF37]"
                      : "text-white/30"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    isComplete
                      ? "bg-[#34D399]/10 text-[#34D399]"
                      : isCurrent
                        ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                        : "bg-white/[0.04] text-white/20"
                  }`}
                >
                  {isComplete ? (
                    <CheckIcon />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </span>
                {step}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
