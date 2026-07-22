interface ManufacturingHeaderProps {
  title: string;
  projectName: string;
  designId: string;
  customerName: string;
  orderNo: string;
  status: string;
  productionDate: string;
  deliveryDate: string;
}

export function ManufacturingHeader({
  title,
  projectName,
  designId,
  customerName,
  orderNo,
  status,
  productionDate,
  deliveryDate,
}: ManufacturingHeaderProps) {
  return (
    <section
      style={{
        border: "1px solid rgba(148, 163, 184, 0.16)",
        borderRadius: 24,
        padding: 24,
        background: "linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.92))",
        boxShadow: "0 24px 60px rgba(2, 8, 23, 0.28)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, color: "#38bdf8", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em" }}>Manufacturing Center</p>
          <h1 style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800 }}>{title}</h1>
          <p style={{ margin: "6px 0 0", color: "#94a3b8" }}>Dashboard / Manufacturing</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ padding: "10px 14px", borderRadius: 16, background: "rgba(15, 23, 42, 0.8)", minWidth: 170 }}>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>Current Project</p>
            <p style={{ margin: "4px 0 0", fontWeight: 700 }}>{projectName}</p>
          </div>
          <div style={{ padding: "10px 14px", borderRadius: 16, background: "rgba(15, 23, 42, 0.8)", minWidth: 160 }}>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>Status</p>
            <p style={{ margin: "4px 0 0", color: "#22c55e", fontWeight: 700 }}>{status}</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 20 }}>
        {[
          ["Design ID", designId],
          ["Customer Name", customerName],
          ["Order No", orderNo],
          ["Production Date", productionDate],
          ["Estimated Delivery", deliveryDate],
        ].map(([label, value]) => (
          <div key={label} style={{ padding: 12, borderRadius: 16, background: "rgba(15, 23, 42, 0.8)" }}>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>{label}</p>
            <p style={{ margin: "6px 0 0", color: "#f8fafc", fontWeight: 700 }}>{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
