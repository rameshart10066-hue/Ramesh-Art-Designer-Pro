type StatisticsPanelProps = {
  totalSheets: string;
  usedArea: string;
  unusedArea: string;
  utilization: string;
  waste: string;
  totalParts: string;
  cuttingTime: string;
  materialCost: string;
};

export function StatisticsPanel({ totalSheets, usedArea, unusedArea, utilization, waste, totalParts, cuttingTime, materialCost }: StatisticsPanelProps) {
  const rows = [
    ["Total Sheets", totalSheets],
    ["Used Area", usedArea],
    ["Unused Area", unusedArea],
    ["Material Utilization %", utilization],
    ["Waste %", waste],
    ["Total Parts", totalParts],
    ["Estimated Cutting Time", cuttingTime],
    ["Estimated Material Cost", materialCost],
  ];

  return (
    <section
      style={{
        border: "1px solid rgba(148, 163, 184, 0.16)",
        borderRadius: 22,
        padding: 18,
        background: "linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.96))",
        boxShadow: "0 16px 40px rgba(2, 8, 23, 0.24)",
      }}
    >
      <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 18, fontWeight: 700 }}>Statistics</h2>
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "10px 12px", borderRadius: 14, background: "rgba(15, 23, 42, 0.72)" }}>
            <span style={{ color: "#94a3b8", fontSize: 12 }}>{label}</span>
            <span style={{ color: "#f8fafc", fontWeight: 700, textAlign: "right" }}>{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
