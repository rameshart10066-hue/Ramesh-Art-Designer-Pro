import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

/**
 * POST /api/auth/logout
 * Clears the session cookie. No request body — logout doesn't depend on
 * anything the client sends, only on the cookie already present.
 */
export function POST(): NextResponse {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
