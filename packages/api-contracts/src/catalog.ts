/**
 * Catalog domain contracts, shared between the catalog API routes
 * (apps/web/src/app/api/catalog) and the client service/UI
 * (apps/web/src/services/catalogService, src/modules/catalog).
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
}

export interface CatalogQuery {
  /** Free-text search across product name/description. */
  search?: string;
  /** Filter to a single category; omit for all categories. */
  categoryId?: string;
  /** 1-indexed page number. */
  page: number;
  pageSize: number;
}

export interface CatalogResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
