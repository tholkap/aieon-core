import BusinessQuestionCard from "@/components/discovery/BusinessQuestionCard";
import type { AiUnderstandingReport } from "@/components/how-ai-sees-you/mapAiUnderstanding";

export default function BusinessQuestionsSection({
  report,
}: {
  report: AiUnderstandingReport;
}) {
  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">
          Six questions AI asks
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          What AI can answer about your business
        </h2>
        <p className="mt-3 max-w-2xl text-base text-white/55">
          These are the same questions investors, customers, and AI assistants
          ask before they recommend, compare, or describe you.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        {report.questions.map((question) => (
          <BusinessQuestionCard
            key={question.id}
            question={question}
          />
        ))}
      </div>
    </section>
  );
}
