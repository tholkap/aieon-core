import type { AiUnderstandingReport } from "@/components/how-ai-sees-you/mapAiUnderstanding";

function formatScannedAt(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default function UnderstandingSummary({
  report,
}: {
  report: AiUnderstandingReport;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">
        Business understanding report
      </p>
      <h2 className="mt-3 text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl">
        {report.summaryHeadline}
      </h2>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/65">
        {report.summaryBody}
      </p>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-white/60">
          {report.websiteUrl}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-white/60">
          Scanned {formatScannedAt(report.scannedAt)}
        </span>
      </div>

      {report.coverage && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-black/10 p-5">
          <h3 className="text-sm font-medium text-white">Crawl coverage</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            Scanned {report.coverage.pagesScanned} of {report.coverage.pagesDiscovered} discovered internal pages
            {report.coverage.pagesFailed ? `; ${report.coverage.pagesFailed} attempted pages could not be read` : ""}.
            {report.coverage.limitReached
              ? ` The configurable development limit of ${report.coverage.pageLimit} pages was reached, leaving ${report.coverage.pagesSkipped} discovered pages unscanned.`
              : " All discovered pages were attempted."}
            {report.coverage.sitemapUrls.length ? ` Checked ${report.coverage.sitemapUrls.length} sitemap location${report.coverage.sitemapUrls.length === 1 ? "" : "s"}.` : ""}
          </p>
          <details className="mt-3 text-xs text-white/45">
            <summary className="cursor-pointer text-white/60">Pages included in this report</summary>
            <ul className="mt-2 space-y-1 break-all">
              {report.coverage.scannedUrls.map((pageUrl) => <li key={pageUrl}>{pageUrl}</li>)}
            </ul>
          </details>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#34D399]/20 bg-[#34D399]/5 px-5 py-4">
          <p className="text-3xl font-semibold text-[#34D399]">
            {report.stats.clear}
          </p>
          <p className="mt-1 text-sm text-white/55">Supported signals</p>
        </div>
        <div className="rounded-2xl border border-[#FBBF24]/20 bg-[#FBBF24]/5 px-5 py-4">
          <p className="text-3xl font-semibold text-[#FBBF24]">
            {report.stats.partial}
          </p>
          <p className="mt-1 text-sm text-white/55">Partially clear</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
          <p className="text-3xl font-semibold text-white/40">
            {report.stats.missing}
          </p>
          <p className="mt-1 text-sm text-white/55">Not identified</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
          <p className="text-3xl font-semibold text-white/40">{report.stats.notAssessed}</p>
          <p className="mt-1 text-sm text-white/55">Not assessed yet</p>
        </div>
      </div>
    </section>
  );
}
