import type { Observation } from "@/src/types/observation";

export interface DeliveryFinding {
  id: string;
  title: string;
  explanation: string;
  nextStep: string;
  sources: [Observation, Observation];
}
export interface DeliveryConsistencyResult {
  findings: DeliveryFinding[];
  claimsChecked: number;
  comparableGroups: number;
  truncated: boolean;
}

// Deliberately compares complete extracted statements. Do not discard locations,
// dates, order conditions or service qualifiers to manufacture a match.
const currencyAmount = /\b(QAR|QR|AED|USD|EUR|GBP)\s+(\d+(?:,\d{3})*(?:\.\d{1,2})?)\b/gi;
const unsafe = /[<>?"“”]|\b(?:not|no|never|may|might|could|would|example|previously|formerly|was|were|from|up to|starting|save|discount)\b/i;
const eligible = new Set(["paragraph", "meta-description"]);
const MAX_CLAIMS = 300;
const MAX_FINDINGS = 10;

export function checkDeliveryConsistency(observations: Observation[]): DeliveryConsistencyResult {
  const groups = new Map<string, Array<{ observation: Observation; amount: number }>>();
  const seen = new Set<string>();
  let claimsChecked = 0;
  let truncated = false;
  for (const observation of observations) {
    if (!eligible.has(observation.sourceType)) continue;
    const text = observation.rawValue.trim().replace(/\s+/g, " ");
    if (text.length > 600 || unsafe.test(text)) continue;
    const amounts = [...text.matchAll(currencyAmount)];
    if (amounts.length !== 1) continue;
    const money = amounts[0];
    const fee = /\b(?:delivery|shipping)\s+(?:fee|charge|cost)(?:\s+\w+){0,5}?\s*(?:is|:)?\s*$/i.test(text.slice(0, money.index));
    const threshold = /\bfree\s+(?:delivery|shipping)\b[^.!?]*\b(?:over|above|at least)\s*$/i.test(text.slice(0, money.index));
    if (!fee && !threshold) continue;
    let url: URL;
    try { url = new URL(observation.pageUrl); } catch { continue; }
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) continue;
    url.hash = "";
    const currency = money[1].toUpperCase() === "QR" ? "QAR" : money[1].toUpperCase();
    const amount = Number(money[2].replaceAll(",", ""));
    if (!Number.isFinite(amount)) continue;
    const context = (text.slice(0, money.index) + "{amount}" + text.slice(money.index! + money[0].length))
      .toLowerCase().replace(/[.!]$/, "").trim();
    const key = `${url.origin}|${threshold ? "threshold" : "fee"}|${currency}|${context}`;
    const duplicateKey = `${key}|${url.href}|${amount}`;
    if (seen.has(duplicateKey)) continue;
    if (claimsChecked >= MAX_CLAIMS) { truncated = true; break; }
    seen.add(duplicateKey);
    claimsChecked++;
    const group = groups.get(key) ?? [];
    group.push({ observation, amount });
    groups.set(key, group);
  }
  const findings: DeliveryFinding[] = [];
  let comparableGroups = 0;
  for (const [key, group] of groups) {
    if (new Set(group.map(c => c.observation.pageUrl.split("#")[0])).size < 2) continue;
    comparableGroups++;
    // One representative differing pair per complete statement; repeated banners
    // do not multiply findings or raise confidence.
    const first = group.find(a => group.some(b => b.amount !== a.amount && b.observation.pageUrl.split("#")[0] !== a.observation.pageUrl.split("#")[0]));
    if (!first) continue;
    const other = group.find(c => c.amount !== first.amount && c.observation.pageUrl.split("#")[0] !== first.observation.pageUrl.split("#")[0])!;
    if (findings.length >= MAX_FINDINGS) { truncated = true; continue; }
    const threshold = key.includes("|threshold|");
    findings.push({
      id: `delivery-${findings.length + 1}`,
      title: threshold ? "Different free-delivery thresholds in matching statements" : "Different delivery charges in matching statements",
      explanation: "These extracted statements use matching wording and currency but different amounts on different pages. Surrounding page context or an expired offer may explain the difference; this is a review candidate, not a confirmed checkout error.",
      nextStep: `Open both pages and confirm that the location, service, dates and order conditions are the same. Verify the current ${threshold ? "minimum order for free delivery" : "delivery charge"} against your checkout settings. If these statements cover the same conditions, update the outdated amount and rescan both pages. AiEON cannot choose the correct amount for you.`,
      sources: [first.observation, other.observation],
    });
  }
  return { findings, claimsChecked, comparableGroups, truncated };
}
