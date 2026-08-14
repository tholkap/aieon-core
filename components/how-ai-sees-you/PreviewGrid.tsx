const PREVIEW_QUESTIONS = [
  {
    question: "Who are they?",
    hint: "Brand identity and naming clarity",
  },
  {
    question: "What do they offer?",
    hint: "Products, services, and value proposition",
  },
  {
    question: "Who do they help?",
    hint: "Target audience and ideal customers",
  },
  {
    question: "Why trust them?",
    hint: "Reviews, proof, and credibility signals",
  },
  {
    question: "Why choose them?",
    hint: "Differentiation and competitive advantages",
  },
  {
    question: "What should visitors do next?",
    hint: "Calls to action and conversion paths",
  },
] as const;

export default function PreviewGrid() {
  return (
    <section className="space-y-6">
      <header className="text-center sm:text-left">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">
          What you will learn
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">
          Six questions every AI asks before recommending a business
        </h2>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PREVIEW_QUESTIONS.map((item) => (
          <div
            key={item.question}
            className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-left transition-colors hover:border-white/15"
          >
            <p className="text-sm font-medium text-white/75">{item.question}</p>
            <p className="mt-2 text-xs leading-relaxed text-white/35">
              {item.hint}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
