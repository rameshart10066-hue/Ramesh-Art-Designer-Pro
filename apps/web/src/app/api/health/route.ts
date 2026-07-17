import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Basic liveness check. Every future backend module should expose its own
 * route under src/app/api/<module>/ rather than growing this file.
 */
export function GET(): NextResponse {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
