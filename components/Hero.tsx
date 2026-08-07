import WebsiteInput from "@/components/WebsiteInput";

export default function Hero() {
  return (
    <>
      <p className="mb-10 text-xs font-medium uppercase tracking-[0.2em] text-white/50 sm:mb-12 sm:text-sm">
        AiEON <span className="text-[#D4AF37]">•</span> 77
      </p>

      <h1 className="mb-8 max-w-xl text-[2rem] font-semibold leading-[1.15] tracking-[-0.02em] sm:mb-10 sm:text-[2.75rem] sm:leading-[1.1] lg:text-[3.25rem]">
        AI can&apos;t recommend what it doesn&apos;t clearly understand.
      </h1>

      <p className="mb-14 max-w-md text-base leading-relaxed text-white/60 sm:mb-16 sm:text-lg sm:leading-8">
        Discover how AI sees your business and improve how you&apos;re
        understood and recommended by AI assistants.
      </p>

      <WebsiteInput />
    </>
  );
}
