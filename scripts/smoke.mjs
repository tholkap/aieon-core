import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

// Keep the server and its HTTP client in one process tree. Some CI sandboxes
// isolate the network of separate shell sessions.
const unconfigured = process.argv.includes("--unconfigured");
const password = randomBytes(32).toString("hex");
const authorization = "Basic " + Buffer.from("founder:" + password).toString("base64");
const port = 3197;
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NODE_ENV: "production", AIEON_PILOT_USERNAME: unconfigured ? "" : "founder", AIEON_PILOT_PASSWORD: unconfigured ? "" : password } });
let logs = "";
server.stderr.on("data", (chunk) => { logs += chunk; });

try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Server did not start: ${logs}`)), 20_000);
    server.once("exit", (code) => { clearTimeout(timeout); reject(new Error(`Server exited: ${code}; ${logs}`)); });
    server.stdout.on("data", (chunk) => {
      logs += chunk;
      if (logs.includes("Ready in")) { clearTimeout(timeout); resolve(); }
    });
  });
  if (unconfigured) {
    for (const route of ["/", "/how-ai-sees-you", "/discovery", "/api/health"]) {
      assert.equal((await fetch(origin + route)).status, 503, route);
    }
    console.log("PASS: missing pilot configuration fails closed.");
  } else {
  const health = await fetch(origin + "/api/health");
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: "ready" });
  for (const route of ["/", "/discovery", "/how-ai-sees-you"]) {
    const denied = await fetch(`${origin}${route}`);
    assert.equal(denied.status, 401, route);
    assert.match(denied.headers.get("www-authenticate"), /Basic/);
    assert.equal((await fetch(`${origin}${route}`, { headers: { authorization: "Basic d3Jvbmc6d3Jvbmc=" } })).status, 401);
    const response = await fetch(`${origin}${route}`, { headers: { authorization } });
    assert.equal(response.status, 200, route);
    if (route === "/") assert.ok(response.url.endsWith("/how-ai-sees-you"), "Homepage must lead to the working scanner");
    const html = await response.text();
    assert.ok(html.length > 1000, route);
    if (route === "/how-ai-sees-you") {
      assert.match(html, /How AI Sees You/);
      assert.match(html, /Website URL/);
      assert.match(html, /No frontier AI comparison has been run/);
    }
  }
  const manifest = JSON.parse(await readFile(".next/server/server-reference-manifest.json", "utf8"));
  const actionId = Object.entries(manifest.node).find(([, action]) => action.exportedName === "runDiscovery")?.[0];
  assert.ok(actionId, "Built discovery server action must exist");
  const deniedAction = await fetch(origin + "/how-ai-sees-you", {
    method: "POST",
    headers: { "next-action": actionId, "content-type": "text/plain;charset=UTF-8", origin, "x-middleware-subrequest": "proxy:proxy:proxy:proxy:proxy" },
    body: JSON.stringify(["https://example.com/"]),
  });
  assert.equal(deniedAction.status, 401, "Unauthenticated scan must be rejected");
  const invoke = async (url) => {
    const response = await fetch(`${origin}/how-ai-sees-you`, {
      method: "POST",
      headers: { "next-action": actionId, "content-type": "text/plain;charset=UTF-8", origin, authorization },
      body: JSON.stringify([url]),
      signal: AbortSignal.timeout(25_000),
    });
    assert.equal(response.status, 200);
    return response.text();
  };
  assert.match(await invoke("ftp://example.com/"), /Only HTTP and HTTPS website URLs are allowed/);
  assert.match(await invoke(null), /Enter a website URL/);
  assert.match(await invoke("http://169.254.169.254/"), /Only publicly accessible website addresses/);
  assert.match(await invoke("https://user:secret@example.com/"), /without credentials or a custom port/);
  assert.ok(!logs.includes("user:secret"), "Credentials must not be logged");
  if (process.argv.includes("--live")) {
    const result = await invoke("https://www.apple.com/");
    assert.match(result, /"observations":\[/);
    assert.match(result, /"resolvedIdentity":\{/);
    assert.match(result, /"sourceType":"title"/);
    console.log("PASS: three routes, invalid URL handling, and live Apple discovery through the production server action.");
  } else {
    console.log("PASS: three routes and invalid URL handling through the production server action.");
  }
  assert.ok(!logs.includes(password), "Pilot password must not be logged");
  }
} finally {
  server.kill("SIGTERM");
}
