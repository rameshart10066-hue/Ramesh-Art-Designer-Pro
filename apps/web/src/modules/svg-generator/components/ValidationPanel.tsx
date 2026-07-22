type ValidationPanelProps = {
  closedPaths: string;
  openPaths: string;
  duplicateLines: string;
  overlappingLines: string;
  warnings: string;
  status: string;
};

export function ValidationPanel({ closedPaths, openPaths, duplicateLines, overlappingLines, warnings, status }: ValidationPanelProps) {
  const rows = [
    ["Closed Paths", closedPaths],
    ["Open Paths", openPaths],
    ["Duplicate Lines", duplicateLines],
    ["Overlapping Lines", overlappingLines],
    ["Warnings", warnings],
    ["Status", status],
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
      <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 18, fontWeight: 700 }}>SVG Validation</h2>
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "10px 12px", borderRadius: 14, background: "rgba(15, 23, 42, 0.72)" }}>
            <span style={{ color: "#94a3b8", fontSize: 12 }}>{label}</span>
            <span style={{ color: label === "Status" ? "#22c55e" : "#f8fafc", fontWeight: 700 }}>{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
