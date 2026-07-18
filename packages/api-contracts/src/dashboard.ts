/**
 * Dashboard domain contracts, shared between the summary API route
 * (apps/web/src/app/api/dashboard/summary) and the client
 * service/UI (apps/web/src/services/dashboardService, src/modules/dashboard).
 */

export interface DashboardMetric {
  /** Stable key, e.g. "activeOrders" — used as the React list key. */
  key: string;
  label: string;
  value: number;
  /** Optional unit/prefix hint for display, e.g. "currency" | "count". */
  format: "count" | "currency";
}

export type ModuleStatus = "available" | "in-progress" | "planned";

export interface ModuleLink {
  key: string;
  label: string;
  description: string;
  href: string;
  status: ModuleStatus;
}

export interface DashboardSummary {
  metrics: DashboardMetric[];
  modules: ModuleLink[];
  generatedAt: string;
}
