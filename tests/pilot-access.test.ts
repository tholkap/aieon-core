import assert from "node:assert/strict";
import test from "node:test";
import { pilotAccess, pilotConfigured } from "../src/server/pilot-access";

const password = "test-only-password-with-at-least-32-characters";
const env = { NODE_ENV: "production", AIEON_PILOT_USERNAME: "founder", AIEON_PILOT_PASSWORD: password };
const basic = (value: string) => "Basic " + Buffer.from(value).toString("base64");

test("production requires complete, valid pilot configuration", () => {
  for (const candidate of [{}, { NODE_ENV: "production" }, { ...env, AIEON_PILOT_PASSWORD: "short" }, { ...env, AIEON_PILOT_USERNAME: "bad:user" }]) {
    assert.equal(pilotConfigured(candidate), false);
    assert.equal(pilotAccess(null, candidate), "unconfigured");
  }
});
test("only exact pilot credentials grant access", () => {
  assert.equal(pilotAccess(basic("founder:" + password), env), "authorized");
  for (const header of [null, "", "Bearer abc", "Basic !!!", basic("other:" + password), basic("founder:wrong"), "Basic " + "A".repeat(1025)]) {
    assert.equal(pilotAccess(header, env), "denied");
  }
});
test("credential-free bypass is restricted to explicit local development", () => {
  assert.equal(pilotAccess(null, { NODE_ENV: "development" }), "authorized");
  assert.equal(pilotAccess(null, { NODE_ENV: "test" }), "unconfigured");
  assert.equal(pilotAccess(null, { ...env, NODE_ENV: "development" }), "denied");
  assert.equal(pilotAccess(null, { NODE_ENV: "development", AIEON_PILOT_USERNAME: "founder" }), "unconfigured");
});
