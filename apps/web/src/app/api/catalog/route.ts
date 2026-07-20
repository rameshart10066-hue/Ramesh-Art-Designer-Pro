import { NextResponse } from "next/server";
import type { CatalogResponse } from "@ramesh/api-contracts";
import { PRODUCTS, queryCatalog } from "@/lib/catalog";

const DEFAULT_PAGE_SIZE = 12;

/**
 * GET /api/catalog?search=&categoryId=&page=&pageSize=
 * Thin HTTP adapter: parses query params, delegates filtering/pagination
 * to queryCatalog. All params are optional except none are required —
 * an empty query returns page 1 of the full unfiltered catalog.
 */
export function GET(request: Request): NextResponse<CatalogResponse> {
  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search") ?? undefined;
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE));

  const result = queryCatalog(PRODUCTS, {
    ...(search ? { search } : {}),
    ...(categoryId ? { categoryId } : {}),
    page,
    pageSize,
  });

  return NextResponse.json(result);
}
