import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashPassword } from "../password";

// @ramesh/database's Prisma client can't be generated in this sandbox
// (see docs/ARCHITECTURE.md note / PR description), so credentials.ts is
// tested against a mocked db rather than a real one. On a machine with
// normal network access, `prisma generate` produces the real typed client
// and this mock continues to work unchanged since it only depends on the
// db.user.findUnique/create shape.
const { findUnique, create } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@ramesh/database", () => ({
  db: { user: { findUnique, create } },
}));

const { validateLoginCredentials, registerUser } = await import("../credentials");

describe("credentials", () => {
  beforeEach(() => {
    findUnique.mockReset();
    create.mockReset();
  });

  describe("validateLoginCredentials", () => {
    it("rejects a missing email/password before touching the database", async () => {
      const result = await validateLoginCredentials({ email: "", password: "" });
      expect(result).toEqual({ success: false, error: "Email and password are required." });
      expect(findUnique).not.toHaveBeenCalled();
    });

    it("rejects an unknown email with a generic error (no user enumeration)", async () => {
      findUnique.mockResolvedValue(null);
      const result = await validateLoginCredentials({
        email: "nobody@example.com",
        password: "password123",
      });
      expect(result).toEqual({ success: false, error: "Invalid email or password." });
    });

    it("rejects a wrong password with the same generic error", async () => {
      const passwordHash = await hashPassword("correct-password");
      findUnique.mockResolvedValue({ id: "u1", email: "karan@example.com", passwordHash });

      const result = await validateLoginCredentials({
        email: "karan@example.com",
        password: "wrong-password",
      });
      expect(result).toEqual({ success: false, error: "Invalid email or password." });
    });

    it("succeeds with correct credentials", async () => {
      const passwordHash = await hashPassword("correct-password");
      findUnique.mockResolvedValue({ id: "u1", email: "karan@example.com", passwordHash });

      const result = await validateLoginCredentials({
        email: "karan@example.com",
        password: "correct-password",
      });
      expect(result).toEqual({
        success: true,
        user: { id: "u1", email: "karan@example.com" },
      });
    });
  });

  describe("registerUser", () => {
    it("rejects a duplicate email", async () => {
      findUnique.mockResolvedValue({ id: "existing", email: "karan@example.com" });

      const result = await registerUser({
        email: "karan@example.com",
        password: "password123",
      });
      expect(result).toEqual({
        success: false,
        error: "An account with this email already exists.",
      });
      expect(create).not.toHaveBeenCalled();
    });

    it("creates a new user with a hashed password", async () => {
      findUnique.mockResolvedValue(null);
      create.mockResolvedValue({ id: "new-user", email: "new@example.com" });

      const result = await registerUser({ email: "new@example.com", password: "password123" });

      expect(create).toHaveBeenCalledTimes(1);
      const createCall = create.mock.calls[0];
      if (!createCall) throw new Error("expected create() to have been called");
      const createArgs = createCall[0];
      expect(createArgs.data.email).toBe("new@example.com");
      expect(createArgs.data.passwordHash).not.toBe("password123"); // never store plaintext
      expect(result).toEqual({ success: true, user: { id: "new-user", email: "new@example.com" } });
    });
  });
});
