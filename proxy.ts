import { NextRequest, NextResponse } from "next/server";
import { pilotAccess } from "./src/server/pilot-access";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/health" && ["GET", "HEAD"].includes(request.method)) return NextResponse.next();
  const access = pilotAccess(request.headers.get("authorization"));
  const response = access === "authorized" ? NextResponse.next() :
    new NextResponse(access === "unconfigured" ? "Private pilot is not configured." : "Sign in to the AiEON private pilot.", {
      status: access === "unconfigured" ? 503 : 401,
      headers: access === "denied" ? { "WWW-Authenticate": 'Basic realm="AiEON private pilot", charset="UTF-8"' } : {},
    });
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
