export default function WebsiteInput() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
      <input
        type="text"
        placeholder="yourbusiness.com"
        className="h-14 w-full flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-6 text-base text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#D4AF37]/40 focus:bg-white/[0.06] sm:h-16 sm:rounded-full sm:px-8"
      />
      <button
        type="button"
        className="h-14 shrink-0 rounded-2xl bg-[#D4AF37] px-10 text-base font-medium text-[#081426] transition-opacity hover:opacity-90 sm:h-16 sm:rounded-full sm:px-12"
      >
        Analyze Free
      </button>
    </div>
  );
}
