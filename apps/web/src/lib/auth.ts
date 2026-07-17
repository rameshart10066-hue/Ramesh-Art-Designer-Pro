import type { LoginRequest, LoginResponse } from "@ramesh/api-contracts";

/**
 * Validates login credentials and returns a LoginResponse.
 *
 * TODO(auth): Wire this up to @ramesh/database once a User model exists
 * in packages/database/prisma/schema.prisma (lookup by email, verify
 * hashed password with a library such as bcrypt/argon2). Intentionally
 * kept as its own function — separate from the route handler — so the
 * route stays a thin HTTP adapter and this logic can be unit-tested and
 * swapped out without touching request/response handling.
 */
export async function validateCredentials(credentials: LoginRequest): Promise<LoginResponse> {
  const { email, password } = credentials;

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { success: false, error: "Enter a valid email address." };
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  // Placeholder until the database-backed check lands (see TODO above).
  return { success: false, error: "Authentication is not yet connected to a user database." };
}
