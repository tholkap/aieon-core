import { WebsiteCrawler } from '../src/core/discovery/WebsiteCrawler';
import { IdentityInterpreter } from '../src/core/interpreter/IdentityInterpreter';
import { mapDiscoveryToAiUnderstanding } from '../components/how-ai-sees-you/mapAiUnderstanding';

// Read-only public benchmark. No model calls or paid services; robots and budgets apply.
async function main() {
  for (const url of ['https://www.apple.com/', 'https://www.walmart.com/', 'https://thepeninsulaqatar.com/']) {
    const start = Date.now();
    try {
      const {observations, coverage} = await new WebsiteCrawler().crawl(url);
      const report = mapDiscoveryToAiUnderstanding(url, observations, new IdentityInterpreter().interpret(observations), coverage);
      console.log(JSON.stringify({url, elapsedMs: Date.now() - start, coverage,
        questions: report.questions.map(q => ({question: q.question, status:q.status, assessment:q.assessment, summary:q.summary, sources:q.sources?.slice(0,3)})),
        recommendations:report.recommendations,
      }));
      if (coverage.pagesScanned < 2) process.exitCode = 1;
    } catch (error) {
      console.log(JSON.stringify({url, elapsedMs:Date.now()-start, error:error instanceof Error ? error.message : 'Scan failed'}));
      process.exitCode = 1;
    }
  }
}
void main();
