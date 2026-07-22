interface AssemblyItem {
  partNumber: string;
  partName: string;
  quantity: number;
  sheetNumber: string;
}

interface AssemblyTableProps {
  items: AssemblyItem[];
}

export function AssemblyTable({ items }: AssemblyTableProps) {
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
      <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 16, fontWeight: 700 }}>Assembly Panel</h2>
      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#e2e8f0" }}>
          <thead>
            <tr style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <th style={{ textAlign: "left", padding: "10px 8px" }}>Part Number</th>
              <th style={{ textAlign: "left", padding: "10px 8px" }}>Part Name</th>
              <th style={{ textAlign: "left", padding: "10px 8px" }}>Quantity</th>
              <th style={{ textAlign: "left", padding: "10px 8px" }}>Sheet Number</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.partNumber} style={{ borderTop: "1px solid rgba(148, 163, 184, 0.14)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 700 }}>{item.partNumber}</td>
                <td style={{ padding: "12px 8px" }}>{item.partName}</td>
                <td style={{ padding: "12px 8px" }}>{item.quantity}</td>
                <td style={{ padding: "12px 8px" }}>{item.sheetNumber}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
