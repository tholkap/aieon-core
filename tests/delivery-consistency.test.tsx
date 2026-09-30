import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { checkDeliveryConsistency } from "../src/consistency/DeliveryConsistency";
import { HtmlParser } from "../src/core/discovery/HtmlParser";
import { IdentityInterpreter } from "../src/core/interpreter/IdentityInterpreter";
import { mapDiscoveryToAiUnderstanding } from "../components/how-ai-sees-you/mapAiUnderstanding";
import ConsistencySection from "../components/how-ai-sees-you/ConsistencySection";

const parser = new HtmlParser();
function pair(a: string, b: string) {
  return [...parser.parse(`<p>${a}</p>`, "https://example.com/"), ...parser.parse(`<p>${b}</p>`, "https://example.com/policies/shipping")];
}
test("different delivery amounts produce an actionable finding with original sources", () => {
  const observations = pair("Delivery charge in Doha is QAR 10.", "Delivery charge in Doha is QR 20.");
  const result = checkDeliveryConsistency(observations);
  assert.equal(result.findings.length, 1);
  assert.equal(result.comparableGroups, 1);
  assert.deepEqual(result.findings[0].sources, observations);
  assert.match(result.findings[0].nextStep, /checkout settings/);
  const report = mapDiscoveryToAiUnderstanding("https://example.com/", observations, new IdentityInterpreter().interpret(observations));
  assert.deepEqual(report.deliveryConsistency, result);
  const html = renderToStaticMarkup(<ConsistencySection result={result} />);
  assert.match(html, /Needs owner verification/);
  assert.match(html, /Delivery charge in Doha is QAR 10/);
  assert.match(html, /https:\/\/example.com\/policies\/shipping/);
});
test("free-delivery thresholds are compared without changing their conditions", () => {
  assert.equal(checkDeliveryConsistency(pair("Free delivery on orders over QAR 200.", "Free delivery on orders over QAR 250.")).findings.length, 1);
});
for (const [name, a, b] of [
  ["different cities", "Delivery charge in Doha is QAR 10.", "Delivery charge in Al Khor is QAR 20."],
  ["different services", "Standard delivery charge is QAR 10.", "Express delivery charge is QAR 20."],
  ["different currencies", "Delivery charge is QAR 10.", "Delivery charge is AED 20."],
  ["different dates", "Delivery charge in September is QAR 10.", "Delivery charge in October is QAR 20."],
  ["free threshold and regular fee", "Free delivery on orders over QAR 200.", "Delivery charge is QAR 20."],
  ["negation", "Delivery charge is not QAR 10.", "Delivery charge is QAR 20."],
  ["hypothetical", "Delivery charge might be QAR 10.", "Delivery charge might be QAR 20."],
  ["ranges", "Delivery charge from QAR 10.", "Delivery charge from QAR 20."],
  ["multiple amounts", "Delivery charge is QAR 10 below QAR 200.", "Delivery charge is QAR 20 below QAR 200."],
  ["equivalent decimals", "Delivery charge is QAR 10.00.", "Delivery charge is QR 10."],
  ["unrelated product price", "Flower bouquet QAR 10.", "Flower bouquet QAR 20."],
]) test(`does not flag ${name}`, () => assert.equal(checkDeliveryConsistency(pair(a, b)).findings.length, 0));
test("same-page claims and off-origin claims cannot become cross-page findings", () => {
  const obs = pair("Delivery charge is QAR 10.", "Delivery charge is QAR 20.");
  obs[1].pageUrl = obs[0].pageUrl;
  assert.equal(checkDeliveryConsistency(obs).findings.length, 0);
  obs[1].pageUrl = "https://elsewhere.example/policy";
  assert.equal(checkDeliveryConsistency(obs).findings.length, 0);
});
test("repeated banners do not multiply findings", () => {
  const obs = pair("Delivery charge is QAR 10.", "Delivery charge is QAR 20.");
  assert.equal(checkDeliveryConsistency([...obs, ...obs, ...obs]).findings.length, 1);
});
test("no comparable evidence produces a limitation, not an all-clear", () => {
  const result = checkDeliveryConsistency(pair("Hello", "Delivery charge is QAR 20."));
  const html = renderToStaticMarkup(<ConsistencySection result={result} />);
  assert.match(html, /Not enough matching statements/);
  assert.match(html, /does not establish/);
});
test("candidate budget is disclosed and hostile URL schemes excluded", () => {
  const obs = Array.from({length: 305}, (_, i) => ({...pair("Delivery charge is QAR 10.", "Hello")[0], id: String(i), pageUrl: `https://example.com/${i}`}));
  const result = checkDeliveryConsistency(obs);
  assert.equal(result.claimsChecked, 300);
  assert.equal(result.truncated, true);
  const dangerous = pair("Delivery charge is QAR 10.", "Delivery charge is QAR 20.").map(o => ({...o, pageUrl: "javascript:alert(1)"}));
  assert.equal(checkDeliveryConsistency(dangerous).claimsChecked, 0);
});
test("a same-page variant does not hide a differing cross-page pair", () => {
  const obs = [...parser.parse('<p>Delivery charge is QAR 10.</p><p>Delivery charge is QAR 20.</p>', 'https://example.com/'), ...parser.parse('<p>Delivery charge is QAR 10.</p>', 'https://example.com/policy')];
  assert.equal(checkDeliveryConsistency(obs).findings.length, 1);
});
