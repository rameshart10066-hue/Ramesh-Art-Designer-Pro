import type { CatalogQuery, CatalogResponse, Category } from "@ramesh/api-contracts";

/**
 * Client-side catalog service — the catalog UI calls these instead of
 * fetch() directly, matching the pattern used by other modules' services.
 */
export async function getCatalog(query: CatalogQuery): Promise<CatalogResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.search) params.set("search", query.search);
  if (query.categoryId) params.set("categoryId", query.categoryId);

  const response = await fetch(`/api/catalog?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to load catalog (status ${response.status}).`);
  }
  return (await response.json()) as CatalogResponse;
}

export async function getCategories(): Promise<Category[]> {
  const response = await fetch("/api/catalog/categories");
  if (!response.ok) {
    throw new Error(`Failed to load categories (status ${response.status}).`);
  }
  return (await response.json()) as Category[];
}
