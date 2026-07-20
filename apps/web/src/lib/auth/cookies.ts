import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { SessionUser } from "@ramesh/api-contracts";
import { SESSION_COOKIE_NAME, signSessionToken, verifySessionToken } from "./session";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days, matches session.ts expiry

/** Call from a Route Handler after successful login/register. */
export async function attachSessionCookie(
  response: NextResponse,
  user: SessionUser,
): Promise<void> {
  const token = await signSessionToken(user);
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

/** Call from the logout Route Handler. */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

/** Call from Server Components or Route Handlers to read the current user. */
export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
