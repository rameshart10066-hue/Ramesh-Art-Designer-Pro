import type { DashboardMetric } from "@ramesh/api-contracts";
import { formatMetricValue } from "../formatMetricValue";

interface SummaryCardProps {
  metric: DashboardMetric;
}

const ICONS: Record<string, string> = {
  activeOrders: "📦",
  revenue: "💰",
  pendingProduction: "⚙️",
  completedOrders: "✅",
};

/** Presentation-only — no data fetching. Reusable anywhere a metric needs display. */
export function SummaryCard({ metric }: SummaryCardProps) {
  return (
    <div
      data-testid={`summary-card-${metric.key}`}
      style={{
        border: "1px solid rgba(148, 163, 184, 0.18)",
        borderRadius: 20,
        padding: 20,
        minHeight: 132,
        background: "rgba(15, 23, 42, 0.8)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>{metric.label}</p>
        <span style={{ fontSize: 20 }}>{ICONS[metric.key] ?? "▣"}</span>
      </div>
      <p style={{ margin: "12px 0 0", color: "#f8fafc", fontSize: 28, fontWeight: 700 }}>
        {formatMetricValue(metric)}
      </p>
    </div>
  );
}
