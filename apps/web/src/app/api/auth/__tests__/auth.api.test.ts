import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, create } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
}));
vi.mock("@ramesh/database", () => ({ db: { user: { findUnique, create } } }));

// GET /api/auth/session reads next/headers' cookies(), which requires
// Next's request-scoped AsyncLocalStorage context that only exists inside
// a running server. Mocked here so the route can be exercised as a plain
// function call, the same way the other three routes are.
const cookieStore = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieStore.has(name) ? { value: cookieStore.get(name) } : undefined),
  }),
}));

const { POST: registerRoute } = await import("../register/route");
const { POST: loginRoute } = await import("../login/route");
const { POST: logoutRoute } = await import("../logout/route");
const { GET: sessionRoute } = await import("../session/route");

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("auth API routes", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "api-test-secret-at-least-32-bytes!!";
    findUnique.mockReset();
    create.mockReset();
    cookieStore.clear();
  });

  describe("POST /api/auth/register", () => {
    it("returns 201 and a Set-Cookie header on success", async () => {
      findUnique.mockResolvedValueOnce(null);
      create.mockResolvedValueOnce({ id: "u1", email: "new@example.com" });

      const response = await registerRoute(
        jsonRequest("http://localhost/api/auth/register", {
          email: "new@example.com",
          password: "password123",
        }),
      );

      expect(response.status).toBe(201);
      const body = (await response.json()) as { success: boolean };
      expect(body.success).toBe(true);
      expect(response.headers.get("set-cookie")).toContain("ramesh_session=");
    });

    it("returns 422 and no cookie for a duplicate email", async () => {
      findUnique.mockResolvedValueOnce({ id: "existing", email: "dup@example.com" });

      const response = await registerRoute(
        jsonRequest("http://localhost/api/auth/register", {
          email: "dup@example.com",
          password: "password123",
        }),
      );

      expect(response.status).toBe(422);
      expect(response.headers.get("set-cookie")).toBeNull();
    });

    it("returns 400 for an unparsable body", async () => {
      const badRequest = new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: "not json",
      });
      const response = await registerRoute(badRequest);
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("returns 401 for unknown credentials", async () => {
      findUnique.mockResolvedValueOnce(null);
      const response = await loginRoute(
        jsonRequest("http://localhost/api/auth/login", {
          email: "nobody@example.com",
          password: "password123",
        }),
      );
      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("returns 200 and clears the session cookie", async () => {
      const response = await logoutRoute();
      expect(response.status).toBe(200);
      expect(response.headers.get("set-cookie")).toContain("ramesh_session=;");
    });
  });

  describe("GET /api/auth/session", () => {
    it("returns { user: null } when no session cookie is present", async () => {
      const response = await sessionRoute();
      const body = (await response.json()) as { user: unknown };
      expect(body).toEqual({ user: null });
    });

    it("returns the session user when a valid cookie is present", async () => {
      const { signSessionToken, SESSION_COOKIE_NAME } = await import("../../../../lib/auth/session");
      const token = await signSessionToken({ id: "u1", email: "karan@example.com" });
      cookieStore.set(SESSION_COOKIE_NAME, token);

      const response = await sessionRoute();
      const body = (await response.json()) as { user: unknown };
      expect(body).toEqual({ user: { id: "u1", email: "karan@example.com" } });
    });
  });
});
