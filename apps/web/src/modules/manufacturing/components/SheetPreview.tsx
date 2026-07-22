interface SheetPreviewProps {
  sheets: Array<{
    id: string;
    sheetNumber: string;
    parts: Array<{ id: string; label: string }>;
    utilization: number;
    waste: number;
  }>;
}

export function SheetPreview({ sheets }: SheetPreviewProps) {
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 16, fontWeight: 700 }}>Manufacturing Preview</h2>
          <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 12 }}>Thermocol sheet nesting preview</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            ["Zoom", "＋"],
            ["Fit Screen", "◱"],
            ["Previous", "←"],
            ["Next", "→"],
          ].map(([label, icon]) => (
            <button key={label} type="button" style={{ border: "1px solid rgba(148, 163, 184, 0.16)", borderRadius: 999, padding: "8px 10px", background: "rgba(15, 23, 42, 0.8)", color: "#f8fafc", cursor: "pointer" }}>
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {sheets.map((sheet) => (
          <div key={sheet.id} style={{ borderRadius: 18, border: "1px solid rgba(148, 163, 184, 0.16)", padding: 14, background: "rgba(2, 6, 23, 0.9)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div>
                <p style={{ margin: 0, color: "#f8fafc", fontWeight: 700 }}>{sheet.sheetNumber}</p>
                <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 12 }}>39 × 19 inch</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, color: "#38bdf8", fontWeight: 700 }}>{sheet.utilization}% utilized</p>
                <p style={{ margin: "4px 0 0", color: "#fda4af", fontSize: 12 }}>{sheet.waste}% waste</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
              {sheet.parts.map((part) => (
                <div key={part.id} style={{ border: "1px solid rgba(148,163,184,0.2)", borderRadius: 16, padding: 10, background: "linear-gradient(135deg, rgba(79,70,229,0.16), rgba(59,130,246,0.12))" }}>
                  <p style={{ margin: 0, color: "#f8fafc", fontWeight: 700 }}>{part.label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
