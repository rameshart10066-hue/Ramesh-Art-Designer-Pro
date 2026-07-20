import type { CatalogQuery, CatalogResponse, Product } from "@ramesh/api-contracts";

export const MAX_PAGE_SIZE = 100;

/**
 * Pure function: filters `products` by search/category, then paginates.
 * Takes the product array as a parameter (rather than importing data.ts
 * directly) so it can be unit-tested against arbitrary fixtures without
 * depending on the placeholder seed data.
 */
export function queryCatalog(products: Product[], query: CatalogQuery): CatalogResponse {
  const page = Math.max(1, Math.floor(query.page) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(query.pageSize) || 1));

  const searchTerm = query.search?.trim().toLowerCase();
  const filtered = products.filter((product) => {
    const matchesCategory = !query.categoryId || product.categoryId === query.categoryId;
    const matchesSearch =
      !searchTerm ||
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // Clamp rather than error on an out-of-range page (e.g. filters changed
  // and the previously-selected page no longer exists) — returns the last
  // valid page's worth of data instead of an empty/error response.
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    totalPages,
  };
}
