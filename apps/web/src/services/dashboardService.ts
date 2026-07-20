import type { DashboardSummary } from "@ramesh/api-contracts";

/**
 * Client-side dashboard service — the dashboard UI calls this instead of
 * fetch() directly, matching the pattern used by other modules' services.
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch("/api/dashboard/summary");
  if (!response.ok) {
    throw new Error(`Failed to load dashboard summary (status ${response.status}).`);
  }
  return (await response.json()) as DashboardSummary;
}
