import { db } from "@ramesh/database";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@ramesh/api-contracts";
import { hashPassword, verifyPassword } from "./password";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD_LENGTH = 8;

/** Shared by both register and login — keeps the two error messages consistent. */
function validateShape(credentials: LoginRequest | RegisterRequest): string | null {
  if (!credentials.email || !credentials.password) {
    return "Email and password are required.";
  }
  if (!EMAIL_PATTERN.test(credentials.email)) {
    return "Enter a valid email address.";
  }
  if (credentials.password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export async function validateLoginCredentials(credentials: LoginRequest): Promise<AuthResponse> {
  const shapeError = validateShape(credentials);
  if (shapeError) {
    return { success: false, error: shapeError };
  }

  const user = await db.user.findUnique({ where: { email: credentials.email } });

  // Intentionally generic error for both "no such user" and "wrong password"
  // — distinguishing them lets an attacker enumerate registered emails.
  if (!user || !(await verifyPassword(credentials.password, user.passwordHash))) {
    return { success: false, error: "Invalid email or password." };
  }

  return { success: true, user: { id: user.id, email: user.email } };
}

export async function registerUser(credentials: RegisterRequest): Promise<AuthResponse> {
  const shapeError = validateShape(credentials);
  if (shapeError) {
    return { success: false, error: shapeError };
  }

  const existing = await db.user.findUnique({ where: { email: credentials.email } });
  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(credentials.password);
  const user = await db.user.create({
    data: { email: credentials.email, passwordHash },
  });

  return { success: true, user: { id: user.id, email: user.email } };
}
