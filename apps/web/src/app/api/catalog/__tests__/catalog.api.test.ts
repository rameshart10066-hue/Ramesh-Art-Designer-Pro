import { describe, expect, it } from "vitest";
import { GET as catalogRoute } from "../route";
import { GET as categoriesRoute } from "../categories/route";

describe("GET /api/catalog", () => {
  it("returns 200 with default pagination when no query params are given", async () => {
    const response = catalogRoute(new Request("http://localhost/api/catalog"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.page).toBe(1);
    expect(Array.isArray(body.items)).toBe(true);
  });

  it("applies search and category query params", async () => {
    const response = catalogRoute(
      new Request("http://localhost/api/catalog?search=nameplate&categoryId=cat-nameplates"),
    );
    const body = await response.json();
    expect(body.items.every((p: { categoryId: string }) => p.categoryId === "cat-nameplates")).toBe(
      true,
    );
  });

  it("applies page and pageSize query params", async () => {
    const response = catalogRoute(new Request("http://localhost/api/catalog?page=1&pageSize=2"));
    const body = await response.json();
    expect(body.items.length).toBeLessThanOrEqual(2);
    expect(body.pageSize).toBe(2);
  });

  it("returns an empty item list (not an error) for a search with no matches", async () => {
    const response = catalogRoute(
      new Request("http://localhost/api/catalog?search=zzz-no-such-product-zzz"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items).toHaveLength(0);
  });
});

describe("GET /api/catalog/categories", () => {
  it("returns 200 with a non-empty category list", async () => {
    const response = categoriesRoute();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });
});
