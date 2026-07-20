import { NextResponse } from "next/server";
import type { DashboardSummary } from "@ramesh/api-contracts";
import { getDashboardSummary } from "@/lib/dashboard";

/**
 * GET /api/dashboard/summary
 * Thin HTTP adapter over getDashboardSummary. No auth check here — the
 * auth module (route protection middleware) is a separate, unmerged
 * feature branch; this route is intentionally self-contained until
 * that lands.
 */
export function GET(): NextResponse<DashboardSummary> {
  return NextResponse.json(getDashboardSummary());
}
