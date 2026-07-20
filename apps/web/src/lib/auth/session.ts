import { SignJWT, jwtVerify } from "jose";
import type { SessionUser } from "@ramesh/api-contracts";

export const SESSION_COOKIE_NAME = "ramesh_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Uses the Web Crypto API via `jose`, not Node's `crypto` module — this
 * makes it safe to import from middleware.ts (Edge runtime) as well as
 * from regular API routes. Keep bcrypt/Prisma imports out of this file
 * for the same reason.
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ sub: user.id, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

/**
 * Returns the decoded session user, or null for a missing/expired/tampered
 * token. Callers should treat null the same as "not logged in" rather than
 * distinguishing failure reasons, to avoid leaking token-validity details.
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
