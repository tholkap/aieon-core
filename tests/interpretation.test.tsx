import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { HtmlParser } from "../src/core/discovery/HtmlParser";
import { evidenceSnapshot, validateInterpretation } from "../src/interpretation/evidence";
import { runInterpretation } from "../src/interpretation/runInterpretation";
import InterpretationSection from "../components/how-ai-sees-you/InterpretationSection";
const observations = new HtmlParser().parse('<title>Florist</title><p>We offer same-day flower delivery in Doha.</p>', 'https://example.com/');
const snapshot = evidenceSnapshot(observations);
const citation = { sourceId: observations.find(o => o.sourceType === 'paragraph')!.id, quote: 'We offer same-day flower delivery in Doha.' };
const content = { summary: 'The page advertises flower delivery in Doha.', summaryCitations: [citation], findings: [{ title: 'Clarify delivery timing', explanation: 'The cutoff is not established in the supplied content.', customerQuestion: 'Can I order for this evening?', suggestedChange: 'Add your actual cutoff: [confirm cutoff].', factsToConfirm: 'Confirm delivery cutoff and exceptions.', citations: [citation] }] };
const env = { AIEON_AI_PROVIDER: 'openai', AIEON_AI_ENABLED: 'true', AIEON_AI_MODEL: 'test-model', OPENAI_API_KEY: 'fake-test-key' };
const response = (value: unknown = content, status = 'completed') => new Response(JSON.stringify({ status, model: 'test-model', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] }));
test('snapshot is bounded, stable across timestamps, and discloses omitted evidence', () => {
 assert.equal(snapshot.snapshotId, evidenceSnapshot(observations.map(o => ({...o, discoveredAt: 'different'}))).snapshotId);
 const large = evidenceSnapshot(Array.from({length: 1000}, (_,i) => ({...observations[0], id: String(i), rawValue: 'a'.repeat(1000)})));
 assert.ok(large.omittedCount > 0); assert.ok(JSON.stringify(large.sources).length < 16500);
});
test('exact quotes required; fake IDs, altered quotes and missing citations rejected', () => {
 assert.deepEqual(validateInterpretation(content, snapshot.sources), content);
 for (const c of [{...citation, sourceId: 'invented'}, {...citation, quote: 'We guarantee delivery by 6 PM.'}]) assert.throws(() => validateInterpretation({...content, summaryCitations: [c]}, snapshot.sources));
 assert.throws(() => validateInterpretation({...content, summaryCitations: []}, snapshot.sources));
 assert.throws(() => validateInterpretation({...content, findings: Array(4).fill(content.findings[0])}, snapshot.sources));
});
test('disabled or incomplete configuration makes no external request', async () => {
 const transport = (async () => { throw new Error('Must not call'); }) as typeof fetch;
 assert.equal((await runInterpretation(observations, {}, transport)).status, 'not-configured');
 assert.equal((await runInterpretation(observations, {...env, AIEON_AI_ENABLED: 'false'}, transport)).status, 'not-configured');
});
test('request separates untrusted content, disables storage/tools and bounds output; render shows review and quotes', async () => {
 const result = await runInterpretation(observations, env, (async (url, init) => {
  assert.equal(url, 'https://api.openai.com/v1/responses');
  const body = JSON.parse(init!.body as string);
  assert.equal(body.store, false); assert.equal(body.max_output_tokens, 2400); assert.equal(body.tools, undefined);
  assert.match(body.instructions, /UNTRUSTED/); assert.equal(body.instructions.includes(citation.quote), false);
  assert.ok(body.input.includes(citation.quote)); assert.ok(init!.signal);
  return response();
 }) as typeof fetch);
 assert.equal(result.status, 'complete');
 const html = renderToStaticMarkup(<InterpretationSection result={result} />);
 assert.match(html, /Confirm first/); assert.match(html, /Supporting source quotes/); assert.match(html, /not verify the interpretation/);
});
test('provider errors, incomplete output, fabricated citations and refusals fail gracefully', async () => {
 for (const res of [new Response('', {status: 429}), response(content, 'incomplete'), response({...content, summaryCitations: [{...citation, sourceId:'fake'}]}), new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'refusal',refusal:'No'}]}]}))]) {
  assert.equal((await runInterpretation(observations, env, (async () => res) as typeof fetch)).status, 'unavailable');
 }
 assert.equal((await runInterpretation(observations, env, (async () => {throw new Error('secret');}) as typeof fetch)).status, 'unavailable');
});
test('model markup stays text and empty findings do not certify quality', () => {
 const html = renderToStaticMarkup(<InterpretationSection result={{status:'complete',content:{...content, summary:'<script>alert(1)</script>', findings:[]}, model:'test',snapshotId:'test',promptVersion:'test',generatedAt:'test',sourceCount:2,omittedCount:0,sources:snapshot.sources}} />);
 assert.ok(!html.includes('<script>')); assert.match(html, /&lt;script&gt;/); assert.match(html,/not a completeness/);
});
test('oversized output is rejected and request allowance stops further calls', async () => {
 assert.equal((await runInterpretation(observations, env, (async () => new Response('x'.repeat(128001))) as typeof fetch)).status, 'unavailable');
 let requests = 0;
 let result;
 for (let i=0; i<12; i++) result = await runInterpretation(observations, env, (async () => {requests++; return response();}) as typeof fetch);
 assert.equal(result?.status, 'limited'); assert.ok(requests < 12);
});
