import { beforeEach, describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "../session";

describe("session", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret-at-least-32-bytes-long!!";
  });

  const user = { id: "user_123", email: "karan@example.com" };

  it("round-trips a signed token back to the original user", async () => {
    const token = await signSessionToken(user);
    const result = await verifySessionToken(token);
    expect(result).toEqual(user);
  });

  it("returns null for a malformed token", async () => {
    await expect(verifySessionToken("not-a-real-token")).resolves.toBeNull();
  });

  it("returns null for a token signed with a different secret", async () => {
    const token = await signSessionToken(user);
    process.env.SESSION_SECRET = "a-completely-different-secret-value";
    await expect(verifySessionToken(token)).resolves.toBeNull();
  });
});
