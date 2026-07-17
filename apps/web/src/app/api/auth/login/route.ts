import { NextResponse } from "next/server";
import type { LoginRequest } from "@ramesh/api-contracts";
import { attachSessionCookie, validateLoginCredentials } from "@/lib/auth";

/**
 * POST /api/auth/login
 * Thin HTTP adapter: parses the request, delegates to validateLoginCredentials,
 * attaches a session cookie on success, and maps the result to an HTTP status.
 * Business/validation logic lives in lib/auth, not here.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: LoginRequest;

  try {
    body = (await request.json()) as LoginRequest;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const result = await validateLoginCredentials(body);
  const response = NextResponse.json(result, { status: result.success ? 200 : 401 });

  if (result.success) {
    await attachSessionCookie(response, result.user);
  }

  return response;
}
