import type { DeliveryConsistencyResult } from "@/src/consistency/DeliveryConsistency";

export default function ConsistencySection({ result }: { result?: DeliveryConsistencyResult }) {
  if (!result) return null;
  return <section className="space-y-6">
    <div>
      <h2 className="text-2xl font-semibold text-white">Cross-page delivery checks</h2>
      <p className="mt-3 text-sm text-white/65">Compared {result.claimsChecked} recognised delivery statements; {result.comparableGroups} groups had matching wording across pages. Only the extracted English descriptions and paragraphs were checked. Different wording, banners, tables and unscanned content may be missed. Checkout was not tested.</p>
      {result.truncated && <p className="mt-2 text-sm text-amber-200">This check reached its processing or display limit; results are partial.</p>}
    </div>
    {!result.findings.length && <p className="text-white/65">{result.comparableGroups ? "No differing amounts identified in the comparable statements." : "Not enough matching statements across pages to assess consistency."} This does not establish that delivery information is consistent throughout the website.</p>}
    {result.findings.map(f => <article key={f.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
      <p className="text-xs uppercase tracking-wide text-amber-200">Needs owner verification</p>
      <h3 className="text-lg font-medium text-white">{f.title}</h3>
      <p className="text-sm text-white/65">{f.explanation}</p>
      <div className="grid gap-4 md:grid-cols-2">{f.sources.map((s, i) => <blockquote key={`${s.id}-${i}`} className="rounded-xl bg-black/20 p-4 text-sm text-white/80">
        <p>{s.rawValue}</p>
        <a className="mt-3 block break-all underline text-white/60" href={s.pageUrl} target="_blank" rel="noopener noreferrer">{s.pageUrl}</a>
        <p className="mt-2 text-xs text-white/45">{s.sourceType} · {s.selector} · Collected {s.discoveredAt}</p>
      </blockquote>)}</div>
      <p className="text-sm text-white/80"><strong>What to do:</strong> {f.nextStep}</p>
    </article>)}
  </section>;
}
