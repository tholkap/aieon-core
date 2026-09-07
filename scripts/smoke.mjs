import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

// Keep the server and its HTTP client in one process tree. Some CI sandboxes
// isolate the network of separate shell sessions.
const port = 3197;
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], { stdio: ["ignore", "pipe", "pipe"] });
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
  for (const route of ["/", "/discovery", "/how-ai-sees-you"]) {
    const response = await fetch(`${origin}${route}`);
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
  const invoke = async (url) => {
    const response = await fetch(`${origin}/how-ai-sees-you`, {
      method: "POST",
      headers: { "next-action": actionId, "content-type": "text/plain;charset=UTF-8", origin },
      body: JSON.stringify([url]),
      signal: AbortSignal.timeout(25_000),
    });
    assert.equal(response.status, 200);
    return response.text();
  };
  assert.match(await invoke("ftp://example.com/"), /only HTTP and HTTPS are allowed/);
  if (process.argv.includes("--live")) {
    const result = await invoke("https://www.apple.com/");
    assert.match(result, /"observations":\[/);
    assert.match(result, /"resolvedIdentity":\{/);
    assert.match(result, /"sourceType":"title"/);
    console.log("PASS: three routes, invalid URL handling, and live Apple discovery through the production server action.");
  } else {
    console.log("PASS: three routes and invalid URL handling through the production server action.");
  }
} finally {
  server.kill("SIGTERM");
}
