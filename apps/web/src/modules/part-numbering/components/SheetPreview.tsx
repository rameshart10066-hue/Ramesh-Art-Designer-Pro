type SheetPreviewProps = {
  sheetIndex: number;
  totalSheets: number;
  onPrev: () => void;
  onNext: () => void;
  onToggleGrid: () => void;
  showGrid: boolean;
};

export function SheetPreview({ sheetIndex, totalSheets, onPrev, onNext, onToggleGrid, showGrid }: SheetPreviewProps) {
  const sheetLabel = `Sheet ${String(sheetIndex + 1).padStart(2, "0")}`;

  return (
    <section
      style={{
        border: "1px solid rgba(148, 163, 184, 0.16)",
        borderRadius: 24,
        padding: 18,
        background: "linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.96))",
        boxShadow: "0 20px 50px rgba(2, 8, 23, 0.26)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 18, fontWeight: 700 }}>Sheet Preview</h2>
          <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 13 }}>39 × 19 inch sheet placeholders with part labels.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={onPrev} style={{ border: "1px solid rgba(34, 211, 238, 0.24)", borderRadius: 999, padding: "8px 12px", background: "rgba(34, 211, 238, 0.12)", color: "#a5f3fc", cursor: "pointer" }}>
            Previous Sheet
          </button>
          <button type="button" onClick={onNext} style={{ border: "1px solid rgba(34, 211, 238, 0.24)", borderRadius: 999, padding: "8px 12px", background: "rgba(34, 211, 238, 0.12)", color: "#a5f3fc", cursor: "pointer" }}>
            Next Sheet
          </button>
          <button type="button" onClick={onToggleGrid} style={{ border: "1px solid rgba(34, 211, 238, 0.24)", borderRadius: 999, padding: "8px 12px", background: "rgba(34, 211, 238, 0.12)", color: "#a5f3fc", cursor: "pointer" }}>
            {showGrid ? "Hide Grid" : "Show Grid"}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16, borderRadius: 22, overflow: "hidden", border: "1px solid rgba(148, 163, 184, 0.16)", background: "#020617", padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10, color: "#94a3b8", fontSize: 12 }}>
          <span>{sheetLabel}</span>
          <span>{sheetIndex + 1} of {totalSheets}</span>
        </div>
        <div style={{ borderRadius: 16, background: "radial-gradient(circle at top, rgba(56, 189, 248, 0.12), rgba(2, 6, 23, 0.96))", padding: 10 }}>
          <svg viewBox="0 0 620 420" style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x="40" y="40" width="540" height="340" rx="24" fill="#111827" stroke="#38bdf8" strokeWidth="2" opacity="0.9" />
            {showGrid && <g stroke="#334155" strokeWidth="1"><path d="M80 40V380" /><path d="M140 40V380" /><path d="M200 40V380" /><path d="M260 40V380" /><path d="M320 40V380" /><path d="M380 40V380" /><path d="M440 40V380" /><path d="M500 40V380" /><path d="M40 80H580" /><path d="M40 140H580" /><path d="M40 200H580" /><path d="M40 260H580" /><path d="M40 320H580" /></g>}
            <rect x="100" y="90" width="130" height="110" rx="12" fill="#0f766e" stroke="#2dd4bf" strokeWidth="2" />
            <rect x="260" y="90" width="150" height="90" rx="12" fill="#b45309" stroke="#f59e0b" strokeWidth="2" />
            <rect x="148" y="240" width="170" height="80" rx="12" fill="#7c3aed" stroke="#a78bfa" strokeWidth="2" />
            <rect x="370" y="240" width="120" height="80" rx="12" fill="#b91c1c" stroke="#f87171" strokeWidth="2" />
            <g fill="#f8fafc" fontSize="14" fontFamily="Arial">
              <text x="120" y="110">P001</text>
              <text x="285" y="110">P002</text>
              <text x="175" y="260">P003</text>
              <text x="395" y="260">P004</text>
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
