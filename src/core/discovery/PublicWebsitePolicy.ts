import { BlockList, isIP } from "node:net";
import { lookup } from "node:dns/promises";

/** Deliberately conservative public-address policy; no private network scanning. */
const blockedV4 = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10],
  ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24],
  ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) blockedV4.addSubnet(address, prefix, "ipv4");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
const blockedV6 = new BlockList();
for (const [address, prefix] of [
  ["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["3fff::", 20],
] as const) blockedV6.addSubnet(address, prefix, "ipv6");

export class WebsiteFetchError extends Error {}

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !blockedV4.check(address, "ipv4");
  return family === 6 && !address.includes("%") &&
    globalV6.check(address, "ipv6") && !blockedV6.check(address, "ipv6");
}

export function parsePublicWebsiteUrl(input: unknown): URL {
  if (typeof input !== "string" || !input.trim() || input.length > 2048) {
    throw new WebsiteFetchError("Enter a website URL of no more than 2,048 characters.");
  }
  let url: URL;
  try { url = new URL(input.trim()); }
  catch { throw new WebsiteFetchError("Enter a valid website URL, including https://."); }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new WebsiteFetchError("Only HTTP and HTTPS website URLs are allowed.");
  }
  if (url.username || url.password || url.port) {
    throw new WebsiteFetchError("Use a public website URL without credentials or a custom port.");
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  if (!hostname || hostname === "localhost" || /\.(localhost|local|internal|home|test|invalid|onion)$/.test(hostname) ||
      (!isIP(hostname) && !hostname.includes(".")) || (isIP(hostname) && !isPublicAddress(hostname))) {
    throw new WebsiteFetchError("Only publicly accessible website addresses can be scanned.");
  }
  url.hash = "";
  return url;
}

export type AddressResolver = (hostname: string) => Promise<Array<{address: string; family: number}>>;
export const resolveAddresses: AddressResolver = (hostname) => lookup(hostname, {all: true, verbatim: true});

export async function resolvePublicAddress(hostname: string, signal: AbortSignal, resolver: AddressResolver) {
  signal.throwIfAborted();
  const host = hostname.replace(/^\[|\]$/g, "");
  let onAbort: () => void = () => {};
  try {
    const addresses = await Promise.race([
      isIP(host) ? Promise.resolve([{address: host, family: isIP(host)}]) : resolver(host),
      new Promise<never>((_, reject) => {
        onAbort = () => reject(signal.reason);
        signal.addEventListener("abort", onAbort, {once: true});
      }),
    ]);
    signal.throwIfAborted();
    if (!addresses.length || addresses.some(a => !isPublicAddress(a.address) || isIP(a.address) !== a.family)) {
      throw new WebsiteFetchError("Only publicly accessible website addresses can be scanned.");
    }
    // Pin one vetted address. No second DNS lookup is allowed at connection time.
    return addresses.find(a => a.family === 4) ?? addresses[0];
  } finally { signal.removeEventListener("abort", onAbort); }
}
