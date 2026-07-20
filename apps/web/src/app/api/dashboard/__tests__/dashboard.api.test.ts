import { describe, expect, it } from "vitest";
import { GET } from "../summary/route";

describe("GET /api/dashboard/summary", () => {
  it("returns 200 with the DashboardSummary shape", async () => {
    const response = GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.metrics)).toBe(true);
    expect(Array.isArray(body.modules)).toBe(true);
    expect(typeof body.generatedAt).toBe("string");
    expect(() => new Date(body.generatedAt).toISOString()).not.toThrow();
  });

  it("returns a fresh generatedAt timestamp on each call", async () => {
    const first = await GET().json();
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = await GET().json();
    expect(new Date(second.generatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(first.generatedAt).getTime(),
    );
  });
});
