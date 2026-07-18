import { NextResponse } from "next/server";
import type { Category } from "@ramesh/api-contracts";
import { CATEGORIES } from "@/lib/catalog";

/** GET /api/catalog/categories */
export function GET(): NextResponse<Category[]> {
  return NextResponse.json(CATEGORIES);
}
