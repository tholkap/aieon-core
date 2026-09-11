import assert from "node:assert/strict";
import test from "node:test";
import { HtmlParser } from "../src/core/discovery/HtmlParser";
import { runWhoAreTheyEngine } from "../src/questions/who-are-they/execute";

const parse = (html: string, url = "https://www.northstar.com/") => new HtmlParser().parse(html, url);
const report = (html: string, url?: string) => runWhoAreTheyEngine(parse(html,url));

test("matching title and H1 remain distinct corroborating observations", () => {
  const result=report("<title>Northstar</title><h1>Northstar</h1>");
  assert.equal(result.status,"found");
  assert.equal(result.answer,"Northstar");
  assert.deepEqual(result.evidence.map(e=>e.sourceType),["title","h1","domain"]);
});

test("brand/tagline separators do not manufacture different identities", () => {
  for(const [name,title,h1] of [
    ["Harbor Retail","Harbor Retail | Everyday value","Harbor Retail | Everyday value"],
    ["Acme-Co","Acme-Co - Accounting services","Acme-Co"],
    ["City Tribune","City Tribune - News coverage","City Tribune - Homepage"],
  ]) {
    const result=report(`<title>${title}</title><h1>${h1}</h1>`);
    assert.equal(result.status,"found");assert.equal(result.answer,name);
  }
});

test("home-first titles retain an explicit name without inventing corroboration", () => {
  const result=report("<title>Home | Harbor News</title>");
  assert.equal(result.status,"partial");assert.match(result.answer,/Harbor News/);
  assert.doesNotMatch(result.answer,/several/);
});

test("website address aliases do not become competing businesses", () => {
  const result=report("<title>Northstar</title><h1>www.northstar.com</h1>");
  assert.equal(result.answer,"Northstar");assert.equal(result.status,"found");
  assert.ok(!result.blindSpots.some(b=>b.id==="conflicting-candidates"));
});

test("a title alone stays tentative and a description is not a competing name", () => {
  const result=report('<title>Northstar</title><meta name="description" content="We offer software for small businesses.">');
  assert.equal(result.status,"partial");assert.match(result.answer,/Northstar/);
  assert.doesNotMatch(result.answer,/several/);
  assert.ok(!result.evidence.some(e=>e.sourceType==="meta-description"));
});

test("similar names and different domains are never fuzzily merged", () => {
  const result=report("<title>Northstar</title><h1>Northstars</h1>","https://northstars.com/");
  assert.equal(result.status,"partial");
  assert.ok(result.blindSpots.some(b=>b.id==="conflicting-candidates"));
  const nested=report("<title>Shop</title>","https://shop.northstar.co.uk/");
  assert.equal(nested.status,"partial");
  assert.equal(nested.evidence[0].rawValue,"shop.northstar.co.uk");
});

test("generic labels and full descriptions cannot confirm a business name", () => {
  assert.equal(report("<title>Home</title><h1>Home</h1>").status,"partial");
  const result=report('<meta name="description" content="We offer flower delivery in Doha.">');
  assert.equal(result.status,"partial");
  assert.ok(result.evidence.every(e=>e.sourceType==="domain"));
});

test("one observation cannot create title and headline corroboration", () => {
  const observations=parse("<title>Northstar</title><h1>Northstar</h1>");
  observations[1].id=observations[0].id;
  assert.equal(runWhoAreTheyEngine(observations).status,"partial");
});
