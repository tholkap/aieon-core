import type { InterpretationResult, Citation } from "@/src/interpretation/types";
export default function InterpretationSection({ result }: { result?: InterpretationResult }) {
  if (!result) return null;
  if (result.status !== "complete") return <section className="rounded-2xl border border-white/10 p-6" aria-live="polite"><h2 className="text-xl font-semibold">AI interpretation</h2><p className="mt-3 text-white/65">{result.status === "not-configured" ? "AI interpretation is not activated for this pilot. Your evidence report is still available below." : result.status === "limited" ? "The pilot's AI request allowance has been reached. Your evidence report is still available below." : "AI interpretation could not be completed or its source references could not be validated. Your evidence report is still available below."}</p></section>;
  const evidence = (citations: Citation[]) => <details className="mt-4 text-sm text-white/65"><summary className="cursor-pointer">Supporting source quotes</summary>{citations.map((c, i) => {
    const source = result.sources.find((s) => s.id === c.sourceId);
    return <blockquote key={i} className="mt-3 border-l border-white/20 pl-3"><p>{c.quote}</p><p className="mt-1 break-all text-xs">{source?.pageUrl} · {source?.selector}</p></blockquote>;
  })}</details>;
  return <section className="space-y-6 rounded-3xl border border-[#D4AF37]/30 p-6 sm:p-10">
    <div><p className="text-sm text-[#D4AF37]">AI interpretation · Review before acting</p><h2 className="mt-2 text-2xl font-semibold">What your content communicates</h2><p className="mt-4 text-white/80">{result.content.summary}</p>{evidence(result.content.summaryCitations)}</div>
    {result.content.findings.map((f, i) => <article key={i} className="rounded-xl bg-white/5 p-5"><h3 className="text-lg font-semibold">{f.title}</h3><p className="mt-3 text-white/75">{f.explanation}</p><p className="mt-3"><strong>Customer question:</strong> {f.customerQuestion}</p><p className="mt-3 whitespace-pre-wrap"><strong>Suggested change:</strong> {f.suggestedChange}</p><p className="mt-3 text-[#D4AF37]"><strong>Confirm first:</strong> {f.factsToConfirm}</p>{evidence(f.citations)}</article>)}
    {!result.content.findings.length && <p>No specific improvements were proposed from this evidence sample. This is not a completeness or quality certification.</p>}
    <p className="text-sm text-white/55">Source quotes were matched to the extracted page. This does not verify the interpretation or the business claims. Review suggested changes before publishing. This is not a test of live AI search recommendations.</p>
    <details className="text-xs text-white/50"><summary className="cursor-pointer">Analysis scope</summary><p className="mt-2 break-all">Model: {result.model} · {result.generatedAt} · {result.promptVersion}</p><p>{result.sourceCount} source records included; {result.omittedCount} omitted. Single-page HTML sample only.</p><p className="break-all">Evidence reference: {result.snapshotId}</p></details>
  </section>;
}
