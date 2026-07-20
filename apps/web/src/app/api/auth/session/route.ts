import { NextResponse } from "next/server";
import type { SessionResponse } from "@ramesh/api-contracts";
import { getSession } from "@/lib/auth";

/**
 * GET /api/auth/session
 * Returns the current session user (or null). Used by the client to check
 * auth state on load without needing to store anything in localStorage.
 */
export async function GET(): Promise<NextResponse<SessionResponse>> {
  const user = await getSession();
  return NextResponse.json({ user });
}
