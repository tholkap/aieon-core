import { createHash, timingSafeEqual } from "node:crypto";

type PilotEnvironment = { NODE_ENV?: string; AIEON_PILOT_USERNAME?: string; AIEON_PILOT_PASSWORD?: string };

export function pilotConfigured(env: PilotEnvironment = process.env): boolean {
  return /^[a-zA-Z0-9._-]{1,64}$/.test(env.AIEON_PILOT_USERNAME ?? "") &&
    /^[\x21-\x7e]{32,256}$/.test(env.AIEON_PILOT_PASSWORD ?? "");
}

/** Temporary single-founder gate. Not customer authentication or tenant isolation. */
export function pilotAccess(authorization: string | null, env: PilotEnvironment = process.env): "authorized" | "denied" | "unconfigured" {
  if (env.NODE_ENV === "development" && !env.AIEON_PILOT_USERNAME && !env.AIEON_PILOT_PASSWORD) return "authorized";
  if (!pilotConfigured(env)) return "unconfigured";
  if (!authorization || authorization.length > 1024 || !/^Basic [A-Za-z0-9+/]+={0,2}$/i.test(authorization)) return "denied";
  const supplied = Buffer.from(authorization.slice(6), "base64");
  const expected = Buffer.from(`${env.AIEON_PILOT_USERNAME}:${env.AIEON_PILOT_PASSWORD}`, "utf8");
  const digest = (value: Buffer) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(supplied), digest(expected)) ? "authorized" : "denied";
}
