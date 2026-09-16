import assert from "node:assert/strict";
import test from "node:test";
import { HtmlParser } from "../src/core/discovery/HtmlParser";
import { IdentityInterpreter } from "../src/core/interpreter/IdentityInterpreter";
import { runWhatDoTheyOfferEngine, runOfferingUnderstandingEngine } from "../src/questions/what-do-they-offer/execute";
import { mapDiscoveryToBusinessProfile } from "../components/discovery/mapBusinessProfile";
import { extractOfferingCandidates } from "../src/questions/what-do-they-offer/OfferingExtractor";

const pageUrl = "https://example.com/";
function scan(html: string) {
  const observations = new HtmlParser().parse(html, pageUrl);
  return { observations, result: runWhatDoTheyOfferEngine(observations) };
}

const descriptions = [
  ["retailer", "We sell furniture and kitchen appliances for homes."],
  ["manufacturer", "We manufacture precision pumps for industrial facilities."],
  ["SaaS", "Project management software for small teams."],
  ["professional service", "We provide accounting services for small businesses."],
  ["local SME", "Same-day flower delivery in Doha for celebrations."],
  ["university", "We offer undergraduate courses and research training."],
  ["hospitality", "We offer hotel rooms and accommodation in Doha."],
  ["marketplace", "A marketplace platform for buying handmade gifts."],
  ["publisher", "We provide local news and business reporting."],
];

for (const [model, description] of descriptions) {
  test(`${model}: a description is grounded, and a brand headline is not an offering`, () => {
    const { observations, result } = scan(`<title>Northstar</title><meta name="description" content="${description}"><h1>Northstar</h1>`);
    assert.equal(result.answer, description);
    assert.equal(result.status, "partial");
    assert.equal(result.evidence.length, 1);
    assert.equal(result.evidence[0].observationId, observations.find((o) => o.sourceType === "meta-description")!.id);
    const report = mapDiscoveryToBusinessProfile(pageUrl, observations, new IdentityInterpreter().interpret(observations));
    assert.equal(report.questions.find((q) => q.id === "what")?.summary, result.answer);
  });
}

test("brand names, slogans, CTA buttons, and arbitrary lists do not become offerings", () => {
  for (const headline of ["Northstar", "Northstar | Save Money. Live better.", "Surprise and shine", "Homepage", "Acme Software"]) {
    const { observations, result } = scan(`<title>${headline}</title><h1>${headline}</h1><button>Buy now</button><li>Privacy policy</li>`);
    assert.equal(result.status, "missing", headline);
    assert.notEqual(result.answer, headline);
    const knowledge = runOfferingUnderstandingEngine(observations);
    assert.deepEqual(knowledge.products, []);
    assert.deepEqual(knowledge.services, []);
    assert.equal(knowledge.primaryOffering, "");
  }
});

test("corroborated named labels are clues, not verified product categories", () => {
  const { observations, result } = scan('<h1>Northstar</h1><nav><a>Orion Pump</a><a>Products</a><a>About us</a></nav><h2>Orion Pump</h2><h2>Products</h2><h2>About us</h2>');
  assert.equal(result.status, "partial");
  assert.match(result.answer, /Possible offerings.*Orion Pump/);
  assert.doesNotMatch(result.answer, /Products|About us/);
  for (const e of result.evidence) assert.ok(observations.some((o) => o.id === e.observationId && o.rawValue === e.rawValue));
  assert.equal(runOfferingUnderstandingEngine(observations).primaryOffering, "");
});

test("two distinct descriptive sources support an offering; duplicate IDs cannot manufacture corroboration", () => {
  const description = "We provide accounting services for small businesses.";
  const { observations, result } = scan(`<h1>${description}</h1><meta name="description" content="${description}">`);
  assert.equal(result.status, "found");
  assert.equal(new Set(result.evidence.map((e) => e.observationId)).size, 2);
  const onlyHeadline = observations.filter((o) => o.sourceType === "h1");
  assert.equal(runWhatDoTheyOfferEngine([...onlyHeadline, ...onlyHeadline]).status, "partial");
  assert.ok(result.confidence >= 0 && result.confidence <= 1);
});

test("negated services and article headings are not positive offering statements", () => {
  assert.equal(scan('<h1>We do not provide accounting services.</h1>').result.status, "missing");
  assert.equal(scan('<h2>Local company offers new software for schools</h2>').result.status, "missing");
});

test("unrelated negation does not suppress a stated delivery service", () => {
  const description = "Join Northstar+ for free delivery and shipping with no order minimum.";
  assert.equal(scan(`<meta name="description" content="${description}">`).result.answer, description);
});

test("unbacked structured evidence cannot create a fabricated observation reference", () => {
  assert.deepEqual(extractOfferingCandidates({ observations: [], websiteEvidence: { hero: { mainHeadline: "We offer magical services to everyone." } } }), []);
});

test("different descriptions are not labelled conflicting, and service businesses are not told to add products", () => {
  const { result } = scan('<h1>We provide accounting services for businesses.</h1><meta name="description" content="Accounting and consulting services for small teams.">');
  assert.ok(result.blindSpots.every((b) => !/conflict|missing-products|missing-services/.test(b.id)));
  assert.ok(result.recommendations.every((r) => !/Name your products|Name your services/.test(r.title)));
});

for (const [model, description] of descriptions.filter(([, value]) => value.startsWith("We "))) {
  test(`${model}: explicit body copy supplies a sourced, tentative offering`, () => {
    const { observations, result } = scan(`<title>Northstar</title><h1>Northstar</h1><main><p>${description}</p></main>`);
    assert.equal(result.answer, description);
    assert.equal(result.status, "partial");
    assert.equal(result.evidence.length, 1);
    const source = observations.find((o) => o.sourceType === "paragraph")!;
    assert.equal(result.evidence[0].observationId, source.id);
    assert.equal(result.evidence[0].rawValue, description);
    assert.equal(source.selector, "p@0");
    const report = mapDiscoveryToBusinessProfile(pageUrl, observations, new IdentityInterpreter().interpret(observations));
    assert.equal(report.questions.find((q) => q.id === "what")?.summary, description);
  });
}

test("paragraphs exclude marked articles, quotations, chrome and explicitly hidden regions", () => {
  const description = "We provide accounting services for small businesses.";
  for (const region of ["article", "blockquote", "q", "nav", "footer", "header", "aside", "dialog", "template"]) {
    assert.equal(scan(`<${region}><p>${description}</p></${region}>`).result.status, "missing", region);
  }
  for (const attrs of ['hidden', 'inert', 'aria-hidden="true"', 'style="display: none"', 'style="visibility: hidden !important;"']) {
    assert.equal(scan(`<div ${attrs}><p>${description}</p></div>`).result.status, "missing", attrs);
    assert.equal(scan(`<p ${attrs}>${description}</p>`).result.status, "missing", attrs);
  }
  assert.equal(scan(`<p><q>${description}</q></p>`).result.status, "missing");
});

test("body questions, denials, third-party reports and future intentions are not offers", () => {
  for (const copy of [
    "We offer no accounting services.", "We do not provide accounting services.",
    "We provide accounting services?", "We will offer accounting services next year.",
    "Northstar provides accounting services, according to our reporter.",
    '“We provide accounting services,” said the customer.',
    "Software is transforming businesses around the world.",
  ]) assert.equal(scan(`<p>${copy}</p>`).result.status, "missing", copy);
});

test("repeated paragraph wording cannot inflate offering confidence", () => {
  const copy = "We provide accounting services for businesses.";
  const single = scan(`<p>${copy}</p>`).result;
  const repeated = scan(`<p>${copy}</p>`.repeat(30)).result;
  assert.equal(repeated.status, "partial");
  assert.equal(repeated.confidence, single.confidence);
  assert.equal(repeated.evidence.length, 1);
});

test("paragraph collection is bounded and preserves original source indexes", () => {
  const { observations } = scan('<p hidden>Hidden</p>' + '<p>Visible body copy</p>'.repeat(205));
  const paragraphs = observations.filter((o) => o.sourceType === "paragraph");
  assert.equal(paragraphs.length, 200);
  assert.equal(paragraphs[0].selector, "p@1");
  assert.equal(paragraphs.at(-1)?.selector, "p@200");
  assert.equal(scan(`<p>${"x".repeat(2001)}</p>`).observations.length, 0);
});
