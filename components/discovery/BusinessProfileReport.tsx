import BusinessQuestionCard from "@/components/discovery/BusinessQuestionCard";
import type { BusinessProfile } from "@/components/discovery/mapBusinessProfile";

export default function BusinessProfileReport({
  profile,
}: {
  profile: BusinessProfile;
}) {
  const foundCount = profile.questions.filter((q) => q.status === "found").length;
  const gapsCount = profile.questions.length - foundCount;

  return (
    <section className="w-full space-y-8">
      <header className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 to-transparent p-8 text-left">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
          Business understanding report
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          How AI can understand this business today
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/60">
          Based on a scan of{" "}
          <span className="text-white/80">{profile.websiteUrl}</span>. This
          report shows what a deterministic analysis can extract from your
          public homepage — no AI generation, no invented facts.
        </p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2">
            <span className="text-white/50">Clear answers </span>
            <span className="font-semibold text-[#34D399]">{foundCount}</span>
            <span className="text-white/50"> / 6</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2">
            <span className="text-white/50">Gaps to address </span>
            <span className="font-semibold text-[#FBBF24]">{gapsCount}</span>
            <span className="text-white/50"> / 6</span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {profile.questions.map((question, index) => (
          <BusinessQuestionCard
            key={question.id}
            question={question}
            defaultOpen={index === 0 && question.howDetermined !== undefined}
          />
        ))}
      </div>
    </section>
  );
}
