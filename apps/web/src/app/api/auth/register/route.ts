import { NextResponse } from "next/server";
import type { RegisterRequest } from "@ramesh/api-contracts";
import { attachSessionCookie, registerUser } from "@/lib/auth";

/**
 * POST /api/auth/register
 * Thin HTTP adapter over registerUser — creates the account and, on
 * success, logs the user in immediately by attaching a session cookie.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: RegisterRequest;

  try {
    body = (await request.json()) as RegisterRequest;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const result = await registerUser(body);
  // 422: covers both validation failures and duplicate-email conflicts —
  // registerUser's AuthResponse doesn't currently distinguish the two with
  // an error code, so we don't guess a more specific status here.
  const response = NextResponse.json(result, { status: result.success ? 201 : 422 });

  if (result.success) {
    await attachSessionCookie(response, result.user);
  }

  return response;
}
