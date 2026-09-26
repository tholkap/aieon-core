import assert from 'node:assert/strict';
import test from 'node:test';
import { HtmlParser } from '../src/core/discovery/HtmlParser';
import { runInterpretation } from '../src/interpretation/runInterpretation';
const observations = new HtmlParser().parse('<p>We provide flower delivery in Doha.</p>', 'https://example.com/');
const content = {summary:'The page offers flower delivery.',summaryCitations:[{sourceId:observations[0].id,quote:observations[0].rawValue}],findings:[]};
const env = {AIEON_AI_ENABLED:'true',GEMINI_API_KEY:'test-key',OPENAI_API_KEY:'must-not-use'};
const response = (finishReason='STOP', value: unknown=content) => new Response(JSON.stringify({modelVersion:'gemini-2.5-flash',candidates:[{finishReason,content:{parts:[{text:JSON.stringify(value)}]}}]}));
test('Gemini is the default; fixed endpoint, header credential, schema and bounded generation',async()=>{
 const result = await runInterpretation(observations,env,(async(url,init)=>{
  assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');
  const headers=new Headers(init!.headers); assert.equal(headers.get('x-goog-api-key'),'test-key');assert.equal(headers.get('authorization'),null);
  const body=JSON.parse(init!.body as string);assert.match(body.systemInstruction.parts[0].text,/UNTRUSTED/);assert.equal(body.tools,undefined);assert.equal(body.generationConfig.maxOutputTokens,2400);assert.equal(body.generationConfig.thinkingConfig.thinkingBudget,0);assert.ok(body.generationConfig.responseJsonSchema);
  return response();
 }) as typeof fetch);
 assert.equal(result.status,'complete');if(result.status==='complete')assert.match(result.model,/gemini/);
});
test('Gemini failure never retries or falls back to OpenAI',async()=>{
 let calls=0;
 for(const r of [response('MAX_TOKENS'),response('SAFETY'),response('STOP',{...content,summaryCitations:[{sourceId:'fake',quote:'Invented content'}]}),new Response('',{status:429})]) {
  assert.equal((await runInterpretation(observations,env,(async(url)=>{calls++;assert.match(String(url),/googleapis/);return r;}) as typeof fetch)).status,'unavailable');
 }
 assert.equal(calls,4);
});
test('unknown provider or missing Gemini key cannot spend an OpenAI key',async()=>{
 const transport=(async()=>{assert.fail('No call expected');}) as typeof fetch;
 assert.equal((await runInterpretation(observations,{AIEON_AI_ENABLED:'true',OPENAI_API_KEY:'unused',AIEON_AI_MODEL:'unused'},transport)).status,'not-configured');
 assert.equal((await runInterpretation(observations,{...env,AIEON_AI_PROVIDER:'unknown'},transport)).status,'not-configured');
});
