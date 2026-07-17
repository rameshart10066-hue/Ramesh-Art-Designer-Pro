import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Node-only (bcryptjs requires the Node crypto module). Import this from
 * API routes, never from middleware.ts — middleware runs on the Edge
 * runtime where this dependency isn't available.
 */
export async function hashPassword(plainTextPassword: string): Promise<string> {
  return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
}

export async function verifyPassword(plainTextPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, hash);
}
