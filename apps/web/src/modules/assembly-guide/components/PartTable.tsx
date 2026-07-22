type PartTableProps = {
  items: Array<{
    partNumber: string;
    partName: string;
    sheetNumber: string;
    quantity: string;
    status: string;
  }>;
  selectedPart: string;
  onSelectPart: (partNumber: string) => void;
};

export function PartTable({ items, selectedPart, onSelectPart }: PartTableProps) {
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
      <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 18, fontWeight: 700 }}>Part Table</h2>
      <div style={{ overflowX: "auto", marginTop: 14 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ color: "#94a3b8", fontSize: 12, textAlign: "left" }}>
              <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.16)" }}>Part Number</th>
              <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.16)" }}>Part Name</th>
              <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.16)" }}>Sheet Number</th>
              <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.16)" }}>Quantity</th>
              <th style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.16)" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isSelected = item.partNumber === selectedPart;
              return (
                <tr key={item.partNumber} style={{ color: "#f8fafc", cursor: "pointer" }} onClick={() => onSelectPart(item.partNumber)}>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.12)", background: isSelected ? "rgba(34, 211, 238, 0.12)" : undefined }}>{item.partNumber}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.12)", background: isSelected ? "rgba(34, 211, 238, 0.12)" : undefined }}>{item.partName}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.12)", background: isSelected ? "rgba(34, 211, 238, 0.12)" : undefined }}>{item.sheetNumber}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.12)", background: isSelected ? "rgba(34, 211, 238, 0.12)" : undefined }}>{item.quantity}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(148, 163, 184, 0.12)", background: isSelected ? "rgba(34, 211, 238, 0.12)" : undefined }}>{item.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
