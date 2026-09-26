import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { HtmlParser } from '../src/core/discovery/HtmlParser';
import { runInterpretation } from '../src/interpretation/runInterpretation';
import InterpretationSection from '../components/how-ai-sees-you/InterpretationSection';
const observations = new HtmlParser().parse('<p>We offer flower delivery.</p>','https://example.com');
const env={AIEON_AI_ENABLED:'true',GEMINI_API_KEY:'private-key'};
test('provider failures have safe actionable diagnostics without exposing bodies or keys',async()=>{
 for(const [status,reason] of [[400,'request'],[401,'access'],[403,'access'],[404,'model'],[429,'quota'],[500,'provider']] as const){
  const result=await runInterpretation(observations,env,(async()=>new Response('private-key sensitive website text',{status})) as typeof fetch);
  assert.equal(result.status,'unavailable');assert.equal(result.reason,reason);
  const html=renderToStaticMarkup(<InterpretationSection result={result}/>);
  assert.ok(html.includes(`Diagnostic: ${reason}`));assert.ok(!html.includes('private-key'));assert.ok(!html.includes('sensitive website text'));
 }
});
test('timeout and malformed response are distinguishable',async()=>{
 const result=await runInterpretation(observations,env,(async()=>{throw new DOMException('secret','TimeoutError');}) as typeof fetch);
 if(result.status!=='complete')assert.equal(result.reason,'timeout');
 const malformed=await runInterpretation(observations,env,(async()=>new Response('not JSON')) as typeof fetch);
 if(malformed.status!=='complete')assert.equal(malformed.reason,'format');
});
