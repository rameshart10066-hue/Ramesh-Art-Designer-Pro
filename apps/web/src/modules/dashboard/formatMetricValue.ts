import type { DashboardMetric } from "@ramesh/api-contracts";

/**
 * Formats a metric's raw numeric value according to its `format` field.
 * Pure/presentation-only — kept separate from SummaryCard so it's testable
 * without rendering React, and reusable if metrics show up elsewhere
 * (e.g. a future reports page).
 */
export function formatMetricValue(metric: DashboardMetric): string {
  switch (metric.format) {
    case "currency":
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(metric.value);
    case "count":
      return new Intl.NumberFormat("en-IN").format(metric.value);
  }
}
