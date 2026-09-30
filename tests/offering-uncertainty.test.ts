import assert from "node:assert/strict";
import test from "node:test";
import { HtmlParser } from "../src/core/discovery/HtmlParser";
import { createEmptyResolvedIdentity, createQuestionEngineContext } from "../src/questions/shared/QuestionEngine";
import { whatDoTheyOfferQuestionEngine as engine } from "../src/questions/what-do-they-offer/WhatDoTheyOfferQuestionEngine";
for (const copy of ['Could software improve your life?', 'We might offer consulting next year.', 'We plan to provide training.', 'Would you like flower delivery?']) {
  test(`uncertain offering is not an observed offer: ${copy}`, () => {
    const observations = new HtmlParser().parse(`<h1>${copy}</h1>`, 'https://example.com/');
    assert.equal(engine.analyze(createQuestionEngineContext(observations, createEmptyResolvedIdentity())).status, 'missing');
  });
}
