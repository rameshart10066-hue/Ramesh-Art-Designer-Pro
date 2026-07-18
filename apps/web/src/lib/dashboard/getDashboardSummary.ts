import type { DashboardSummary } from "@ramesh/api-contracts";

/**
 * Builds the dashboard summary payload. Currently returns static
 * placeholder data — no orders/finance data sources exist yet (those
 * land with their own feature branches). Swap the placeholder metrics
 * block for real queries once those modules are merged; the route and
 * client already consume whatever this function returns, so no other
 * change is needed when that happens.
 */
export function getDashboardSummary(): DashboardSummary {
  return {
    metrics: [
      { key: "activeOrders", label: "Active Orders", value: 0, format: "count" },
      { key: "pendingDesigns", label: "Pending Designs", value: 0, format: "count" },
      { key: "revenueThisMonth", label: "Revenue (This Month)", value: 0, format: "currency" },
    ],
    modules: [
      {
        key: "design-studio",
        label: "Design Studio",
        description: "Parametric design generation and SVG export.",
        href: "/design-studio",
        status: "in-progress",
      },
      {
        key: "catalog",
        label: "Catalog",
        description: "Manage products and pricing.",
        href: "/catalog",
        status: "planned",
      },
      {
        key: "manufacturing",
        label: "Manufacturing",
        description: "LightBurn export and machine profiles.",
        href: "/manufacturing",
        status: "planned",
      },
      {
        key: "admin",
        label: "Admin",
        description: "Users, roles, and system settings.",
        href: "/admin",
        status: "planned",
      },
    ],
    generatedAt: new Date().toISOString(),
  };
}
