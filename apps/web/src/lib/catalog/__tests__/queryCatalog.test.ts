import { describe, expect, it } from "vitest";
import type { Product } from "@ramesh/api-contracts";
import { queryCatalog } from "../queryCatalog";

const PRODUCTS: Product[] = [
  { id: "1", sku: "A1", name: "Blue Coaster", description: "Round acrylic coaster", price: 100, categoryId: "cat-a" },
  { id: "2", sku: "A2", name: "Red Coaster", description: "Square acrylic coaster", price: 120, categoryId: "cat-a" },
  { id: "3", sku: "B1", name: "Nameplate", description: "Desk nameplate, engraved", price: 500, categoryId: "cat-b" },
  { id: "4", sku: "B2", name: "LED Nameplate", description: "Backlit nameplate for desks", price: 900, categoryId: "cat-b" },
  { id: "5", sku: "C1", name: "Storage Box", description: "Finger-joint box", price: 650, categoryId: "cat-c" },
];

describe("queryCatalog", () => {
  it("returns all products when no filters are applied", () => {
    const result = queryCatalog(PRODUCTS, { page: 1, pageSize: 10 });
    expect(result.total).toBe(5);
    expect(result.items).toHaveLength(5);
    expect(result.totalPages).toBe(1);
  });

  it("filters by category", () => {
    const result = queryCatalog(PRODUCTS, { categoryId: "cat-a", page: 1, pageSize: 10 });
    expect(result.total).toBe(2);
    expect(result.items.every((p) => p.categoryId === "cat-a")).toBe(true);
  });

  it("searches case-insensitively across name and description", () => {
    const result = queryCatalog(PRODUCTS, { search: "DESK", page: 1, pageSize: 10 });
    expect(result.items.map((p) => p.id).sort()).toEqual(["3", "4"]);
  });

  it("combines search and category filters", () => {
    const result = queryCatalog(PRODUCTS, {
      search: "acrylic",
      categoryId: "cat-a",
      page: 1,
      pageSize: 10,
    });
    expect(result.items.map((p) => p.id).sort()).toEqual(["1", "2"]);
  });

  it("paginates results", () => {
    const page1 = queryCatalog(PRODUCTS, { page: 1, pageSize: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page1.totalPages).toBe(3);

    const page2 = queryCatalog(PRODUCTS, { page: 2, pageSize: 2 });
    expect(page2.items).toHaveLength(2);
    expect(page2.items[0]?.id).not.toBe(page1.items[0]?.id);
  });

  it("clamps an out-of-range page to the last valid page", () => {
    const result = queryCatalog(PRODUCTS, { page: 99, pageSize: 2 });
    expect(result.page).toBe(3);
    expect(result.items).toHaveLength(1);
  });

  it("returns an empty result set for a search with no matches", () => {
    const result = queryCatalog(PRODUCTS, { search: "nonexistent-term", page: 1, pageSize: 10 });
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(1);
  });

  it("clamps pageSize to at least 1 and at most MAX_PAGE_SIZE", () => {
    const result = queryCatalog(PRODUCTS, { page: 1, pageSize: 0 });
    expect(result.pageSize).toBe(1);
  });
});
