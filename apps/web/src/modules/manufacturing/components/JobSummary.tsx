interface JobSummaryProps {
  totalSheets: string;
  materialUsed: string;
  materialWaste: string;
  productionTime: string;
  deliveryDate: string;
}

export function JobSummary({ totalSheets, materialUsed, materialWaste, productionTime, deliveryDate }: JobSummaryProps) {
  const items = [
    ["Total Sheets", totalSheets],
    ["Material Used", materialUsed],
    ["Material Waste", materialWaste],
    ["Estimated Production Time", productionTime],
    ["Estimated Delivery", deliveryDate],
  ];

  return (
    <section
      style={{
        border: "1px solid rgba(148, 163, 184, 0.16)",
        borderRadius: 20,
        padding: 18,
        background: "linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(15, 23, 42, 0.95))",
        boxShadow: "0 20px 50px rgba(2, 8, 23, 0.26)",
      }}
    >
      <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 16, fontWeight: 700 }}>Job Summary</h2>
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {items.map(([label, value]) => (
          <div key={label} style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(15, 23, 42, 0.8)" }}>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>{label}</p>
            <p style={{ margin: "6px 0 0", color: "#f8fafc", fontWeight: 700 }}>{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
