import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

// Mocks the database boundary only — every other layer (password hashing,
// session signing, cookie attachment) runs for real, so this test exercises
// the actual cross-module wiring that unit tests (one file at a time) can't.
const { findUnique, create } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
}));
vi.mock("@ramesh/database", () => ({ db: { user: { findUnique, create } } }));

const { registerUser, validateLoginCredentials } = await import("../credentials");
const { attachSessionCookie } = await import("../cookies");
const { verifySessionToken, SESSION_COOKIE_NAME } = await import("../session");

describe("auth integration: register -> cookie -> verify", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "integration-test-secret-32-bytes-long!!";
    findUnique.mockReset();
    create.mockReset();
  });

  it("issues a session cookie on registration whose token verifies back to the same user", async () => {
    findUnique.mockResolvedValueOnce(null); // no existing user with this email
    create.mockResolvedValueOnce({ id: "user_1", email: "karan@example.com" });

    const registerResult = await registerUser({
      email: "karan@example.com",
      password: "correct-horse-battery",
    });
    expect(registerResult.success).toBe(true);
    if (!registerResult.success) return;

    const response = NextResponse.json({ ok: true });
    await attachSessionCookie(response, registerResult.user);

    const cookieHeader = response.cookies.get(SESSION_COOKIE_NAME);
    expect(cookieHeader?.value).toBeTruthy();

    const verified = await verifySessionToken(cookieHeader!.value);
    expect(verified).toEqual({ id: "user_1", email: "karan@example.com" });
  });

  it("login with the freshly-hashed password succeeds against the same mocked user record", async () => {
    // Reuses registerUser's hashing to prove login's verifyPassword call
    // actually matches what registration produced (not just symmetric in
    // isolation, as password.test.ts already covers).
    findUnique.mockResolvedValueOnce(null);
    create.mockImplementationOnce(async (args: { data: { email: string; passwordHash: string } }) => ({
      id: "user_2",
      email: args.data.email,
      passwordHash: args.data.passwordHash,
    }));

    const registerResult = await registerUser({
      email: "priya@example.com",
      password: "another-strong-password",
    });
    expect(registerResult.success).toBe(true);

    const createdRecord = await create.mock.results[0]?.value;
    findUnique.mockResolvedValueOnce(createdRecord);

    const loginResult = await validateLoginCredentials({
      email: "priya@example.com",
      password: "another-strong-password",
    });
    expect(loginResult).toEqual({
      success: true,
      user: { id: "user_2", email: "priya@example.com" },
    });
  });
});
