import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

/**
 * Route protection for authenticated-only pages. Runs on the Edge runtime,
 * so it deliberately imports only lib/auth/session (jose-based, no Node
 * crypto/Prisma) — never lib/auth/password or lib/auth/credentials.
 *
 * Extend the matcher below as protected modules (dashboard, admin, etc.)
 * come online; don't add unrelated route logic to this file.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
