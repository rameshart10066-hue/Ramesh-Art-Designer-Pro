import type { DashboardMetric } from "@ramesh/api-contracts";
import { formatMetricValue } from "../formatMetricValue";

interface SummaryCardProps {
  metric: DashboardMetric;
}

/** Presentation-only — no data fetching. Reusable anywhere a metric needs display. */
export function SummaryCard({ metric }: SummaryCardProps) {
  return (
    <div data-testid={`summary-card-${metric.key}`}>
      <p>{metric.label}</p>
      <p>{formatMetricValue(metric)}</p>
    </div>
  );
}
