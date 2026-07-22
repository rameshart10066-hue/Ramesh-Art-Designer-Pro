type PartTableProps = {
  items: Array<{
    partNumber: string;
    partName: string;
    sheet: string;
    quantity: string;
    layer: string;
    status: string;
  }>;
};

export function PartTable({ items }: PartTableProps) {
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
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 18, fontWeight: 700 }}>Part List Table</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" style={{ border: "1px solid rgba(34, 211, 238, 0.24)", borderRadius: 999, padding: "8px 12px", background: "rgba(34, 211, 238, 0.12)", color: "#a5f3fc", cursor: "pointer" }}>
            Search
          </button>
          <button type="button" style={{ border: "1px solid rgba(34, 211, 238, 0.24)", borderRadius: 999, padding: "8px 12px", background: "rgba(34, 211, 238, 0.12)", color: "#a5f3fc", cursor: "pointer" }}>
            Sort
          </button>
          <button type="button" style={{ border: "1px solid rgba(34, 211, 238, 0.24)", borderRadius: 999, padding: "8px 12px", background: "rgba(34, 211, 238, 0.12)", color: "#a5f3fc", cursor: "pointer" }}>
            Filter
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto", marginTop: 14 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ color: "#94a3b8", fontSize: 12, textAlign: "left" }}>
              <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.16)" }}>Part Number</th>
              <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.16)" }}>Part Name</th>
              <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.16)" }}>Sheet</th>
              <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.16)" }}>Quantity</th>
              <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.16)" }}>Layer</th>
              <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.16)" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.partNumber} style={{ color: "#f8fafc" }}>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.12)" }}>{item.partNumber}</td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.12)" }}>{item.partName}</td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.12)" }}>{item.sheet}</td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.12)" }}>{item.quantity}</td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.12)" }}>{item.layer}</td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.12)" }}>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
