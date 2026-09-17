import { pilotConfigured } from "@/src/server/pilot-access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  const ready = pilotConfigured();
  return Response.json({ status: ready ? "ready" : "unavailable" }, {
    status: ready ? 200 : 503,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
}
