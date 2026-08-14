import { type FormEvent } from "react";

export default function HeroSection({
  url,
  loading,
  onUrlChange,
  onSubmit,
}: {
  url: string;
  loading: boolean;
  onUrlChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] via-transparent to-[#D4AF37]/5 px-6 py-14 sm:px-12 sm:py-20">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#3B82F6]/10 blur-3xl"
        aria-hidden
      />

      <div className="relative max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
          AiEON
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.5rem]">
          How AI Sees You
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/65 sm:text-xl">
          Discover what AI assistants, search engines, and recommendation
          systems can actually understand about your business — from your public
          website alone.
        </p>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/45">
          Built for founders, marketers, consultants, and executives who need
          clarity — not code.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-10 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center"
        >
          <input
            type="url"
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
            placeholder="https://yourcompany.com"
            disabled={loading}
            aria-label="Website URL"
            className="h-14 flex-1 rounded-2xl border border-white/10 bg-[#081426]/60 px-5 text-base text-white placeholder:text-white/30 outline-none backdrop-blur-sm transition-colors focus:border-[#D4AF37]/50 disabled:opacity-50 sm:rounded-full sm:px-6"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="h-14 shrink-0 rounded-2xl bg-[#D4AF37] px-8 text-base font-semibold text-[#081426] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-full"
          >
            {loading ? "Analyzing…" : "Analyze my website"}
          </button>
        </form>
      </div>
    </section>
  );
}
