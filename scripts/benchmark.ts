import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { WebsiteFetcher } from "../src/core/discovery/WebsiteFetcher";
import { HtmlParser } from "../src/core/discovery/HtmlParser";
import { IdentityInterpreter } from "../src/core/interpreter/IdentityInterpreter";
import { mapDiscoveryToAiUnderstanding } from "../components/how-ai-sees-you/mapAiUnderstanding";
import { runOfferingUnderstandingEngine } from "../src/questions/what-do-they-offer/execute";

const sites = [
  { name: "apple", url: "https://www.apple.com/" },
  { name: "walmart", url: "https://www.walmart.com/" },
  { name: "peninsula", url: "https://thepeninsulaqatar.com/" },
  { name: "qatar-tribune", url: "https://www.qatar-tribune.com/" },
];
const args = process.argv.slice(2);
const capture = args.includes("--capture") ? args[args.indexOf("--capture") + 1] : undefined;
const replay = args.includes("--replay") ? args[args.indexOf("--replay") + 1] : undefined;

async function main() {
  if (capture) await mkdir(capture, { recursive: true });
  const results = await Promise.all(sites.map(async ({ name, url }) => {
    try {
      const html = replay
        ? await readFile(join(replay, `${name}.html`), "utf8")
        : await new WebsiteFetcher().fetchHtml(url);
      const sha256 = createHash("sha256").update(html).digest("hex");
      if (replay) {
        const source = JSON.parse(await readFile(join(replay, `${name}.source.json`), "utf8"));
        if (source.url !== url || source.sha256 !== sha256) throw new Error("Captured source URL or content hash does not match.");
      }
      const observations = new HtmlParser().parse(html, url);
      const identity = new IdentityInterpreter().interpret(observations);
      if (capture) {
        await writeFile(join(capture, `${name}.html`), html);
        await writeFile(join(capture, `${name}.source.json`), JSON.stringify({ url, capturedAt: new Date().toISOString(), sha256 }, null, 2));
      }
      return {
        name, url, sha256, observationCount: observations.length,
        title: observations.find((o) => o.sourceType === "title")?.rawValue,
        report: mapDiscoveryToAiUnderstanding(url, observations, identity),
        offeringEngine: runOfferingUnderstandingEngine(observations, identity),
      };
    } catch (error) {
      process.exitCode = 1;
      return { name, url, error: error instanceof Error ? error.message : String(error) };
    }
  }));
  console.log(JSON.stringify({ mode: replay ? "replay" : "live", results }, null, 2));
}

void main();
