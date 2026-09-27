import assert from "node:assert/strict";
import test from "node:test";
import { HtmlParser } from "../src/core/discovery/HtmlParser";
import { createEmptyResolvedIdentity, createQuestionEngineContext } from "../src/questions/shared/QuestionEngine";
import { whoDoTheyHelpQuestionEngine as engine } from "../src/questions/who-do-they-help/WhoDoTheyHelpQuestionEngine";
const analyze = (html: string) => engine.analyze(createQuestionEngineContext(new HtmlParser().parse(html, "https://example.com/"), createEmptyResolvedIdentity()));
for (const copy of ["We provide accounting services for small businesses.", "We help students learn mathematics.", "We serve leisure travelers.", "We build software for developers.", "We work with manufacturers."]) {
  test(`explicit audience: ${copy}`, () => {
    const result = analyze(`<main><p>${copy}</p></main>`);
    assert.equal(result.status, "found");
    assert.equal(result.evidence[0].rawValue, copy);
    assert.equal(result.evidence[0].selector, "p@0");
    assert.ok(result.evidence[0].observationId.startsWith("https://example.com/"));
  });
}
for (const html of [
  '<nav><a>Students</a><a>For businesses</a></nav>',
  '<p>We do not serve students.</p>',
  '<p>We hope to help students.</p>',
  '<article><p>We help students learn.</p></article>',
  '<blockquote><p>We serve businesses.</p></blockquote>',
  '<p hidden>We serve businesses.</p>',
  '<p>Apple sells iPhones.</p>',
  '<p>We offer discounts for students? Ask us.</p>',
  '<p>Our competitor says we serve businesses.</p>',
  '<p>We support software for updates.</p>',
]) test(`no invented audience: ${html}`, () => assert.equal(analyze(html).status, "missing"));
test("headline audience is qualified and repetition does not inflate confidence", () => {
  assert.equal(analyze('<h1>Software for teams</h1>').status, "partial");
  const one = analyze('<p>We serve businesses.</p>');
  const repeated = analyze('<p>We serve businesses.</p><p>We serve businesses.</p>');
  assert.equal(one.confidence, repeated.confidence);
  assert.equal(repeated.evidence.length, 1);
});

test("audience source is displayed in the customer report", async () => {
  const { mapDiscoveryToAiUnderstanding } = await import("../components/how-ai-sees-you/mapAiUnderstanding");
  const observations = new HtmlParser().parse('<p>We serve small businesses.</p>', 'https://example.com/');
  const report = mapDiscoveryToAiUnderstanding('https://example.com/', observations, createEmptyResolvedIdentity());
  const question = report.questions.find((q) => q.id === 'audience')!;
  assert.equal(question.status, 'found');
  assert.equal(question.sources?.[0].quote, 'We serve small businesses.');
  assert.equal(report.stats.assessed, 4);
});

test("subscription use settings remain qualified and retain the original evidence", () => {
  const copy = 'Enjoy weekly flower subscriptions. Flexible plans for homes, offices and gifts.';
  const result = analyze(`<meta name="description" content="${copy}">`);
  assert.equal(result.status, 'partial');
  assert.equal(result.evidence[0].rawValue, copy);
});
for (const copy of ['We do not offer plans for homes.', 'We might offer plans for offices.', 'Plans for offices? Contact us.']) {
  test(`uncertain use setting is not audience evidence: ${copy}`, () => {
    assert.equal(analyze(`<meta name="description" content="${copy}">`).status, 'missing');
  });
}
test("ordinary navigation settings do not establish an audience", () => {
  assert.equal(analyze('<nav><a>Plans for homes</a></nav>').status, 'missing');
});
