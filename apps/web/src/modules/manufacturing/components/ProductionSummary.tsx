interface ProductionSummaryProps {
  designName: string;
  designSize: string;
  material: string;
  thickness: string;
  materialCost: string;
  labourCost: string;
  sellingPrice: string;
  profit: string;
}

export function ProductionSummary({
  designName,
  designSize,
  material,
  thickness,
  materialCost,
  labourCost,
  sellingPrice,
  profit,
}: ProductionSummaryProps) {
  const items = [
    ["Design Name", designName],
    ["Design Size", designSize],
    ["Material", material],
    ["Thermocol Thickness", thickness],
    ["Estimated Material Cost", materialCost],
    ["Estimated Labour Cost", labourCost],
    ["Estimated Selling Price", sellingPrice],
    ["Profit", profit],
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
      <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 16, fontWeight: 700 }}>Production Summary</h2>
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {items.map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 14, background: "rgba(15, 23, 42, 0.8)" }}>
            <span style={{ color: "#94a3b8", fontSize: 12 }}>{label}</span>
            <span style={{ color: "#f8fafc", fontWeight: 700, textAlign: "right" }}>{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
