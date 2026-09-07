import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { HtmlParser } from "../src/core/discovery/HtmlParser";
import { IdentityInterpreter } from "../src/core/interpreter/IdentityInterpreter";
import { mapDiscoveryToAiUnderstanding } from "../components/how-ai-sees-you/mapAiUnderstanding";
import AiUnderstandingReportView from "../components/how-ai-sees-you/AiUnderstandingReport";

function reportFrom(html: string) {
  const observations = new HtmlParser().parse(html, "https://example.com/");
  return mapDiscoveryToAiUnderstanding("https://example.com/", observations, new IdentityInterpreter().interpret(observations));
}

test("unimplemented questions cannot become site deficiencies, review items, or a readiness score", () => {
  const report = reportFrom('<title>Northstar</title><h1>Northstar</h1>');
  const unassessed = report.questions.filter((q) => q.assessment === "not-assessed");
  assert.deepEqual(unassessed.map((q) => q.id), ["audience", "trust", "choose"]);
  assert.equal(report.stats.notAssessed, 3);
  assert.equal(report.stats.assessed, 3);
  assert.equal(report.stats.clear + report.stats.partial + report.stats.missing, 3);
  assert.equal("readinessScore" in report, false);
  assert.equal(report.blindSpots.some((b) => ["audience", "trust", "choose"].includes(b.id)), false);
  assert.equal(report.recommendations.some((r) => /trust|audience|choose/i.test(r.relatedQuestion)), false);
});

test("ordinary navigation is not counted as a customer action", () => {
  const report = reportFrom('<nav><a>Products</a><a>About</a><a>News</a><a>Departments</a><a>Order status</a><a>Book</a><a>Book a room</a><a>Request a quote</a></nav><footer><a>Contact us</a></footer><button>Buy now</button>');
  const action = report.questions.find((q) => q.id === "action")!;
  assert.deepEqual(action.details, ["Book", "Book a room", "Request a quote", "Contact us", "Buy now"]);
  assert.match(action.summary, /Action wording/);
  assert.ok(action.sources?.every((s) => s.pageUrl === "https://example.com/"));
});

test("generic navigation alone produces no action claim", () => {
  const report = reportFrom('<nav><a>Products</a><a>About</a><a>News</a></nav>');
  assert.equal(report.questions.find((q) => q.id === "action")?.status, "missing");
});

test("rendered customer report discloses limits and provides source quotes without unsupported AI predictions", () => {
  const report = reportFrom('<meta name="description" content="We offer flower delivery in Doha."><h1>Northstar</h1>');
  const html = renderToStaticMarkup(<AiUnderstandingReportView report={report} />);
  assert.match(html, /Not assessed yet/);
  assert.match(html, /How we determined this/);
  assert.match(html, /Observed on https:\/\/example.com/);
  assert.match(html, /Frontier AI comparison has not been run/);
  assert.doesNotMatch(html, /\/ 100|AI would struggle|will not recommend|Critical gaps|Clear to AI|high priority|medium priority/);
});

test("crawled markup is rendered as text, not executable markup", () => {
  const report = reportFrom('<h1>Northstar</h1>');
  report.questions[0].sources = [{ observationId: "test", pageUrl: "https://example.com/", sourceType: "h1", selector: "h1", quote: '<script>alert("injection")</script>' }];
  const html = renderToStaticMarkup(<AiUnderstandingReportView report={report} />);
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes('<script>alert("injection")</script>'));
});
