import { describe, expect, it } from "vitest";
import { CATEGORIES, PRODUCTS, queryCatalog } from "../index";

describe("catalog integration: queryCatalog against real seed data", () => {
  it("every product's categoryId references an existing category", () => {
    const categoryIds = new Set(CATEGORIES.map((c) => c.id));
    for (const product of PRODUCTS) {
      expect(categoryIds.has(product.categoryId)).toBe(true);
    }
  });

  it("filtering by each real category returns only products in that category", () => {
    for (const category of CATEGORIES) {
      const result = queryCatalog(PRODUCTS, { categoryId: category.id, page: 1, pageSize: 50 });
      expect(result.items.every((p) => p.categoryId === category.id)).toBe(true);
    }
  });

  it("an unfiltered query returns every seeded product across all pages", () => {
    const result = queryCatalog(PRODUCTS, { page: 1, pageSize: 50 });
    expect(result.total).toBe(PRODUCTS.length);
  });

  it("product SKUs are unique", () => {
    const skus = PRODUCTS.map((p) => p.sku);
    expect(new Set(skus).size).toBe(skus.length);
  });
});
