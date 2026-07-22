type SVGPreviewProps = {
  zoom: number;
  showGrid: boolean;
  showPartNumbers: boolean;
  showSlots: boolean;
  showCutOrder: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
};

export function SVGPreview({
  zoom,
  showGrid,
  showPartNumbers,
  showSlots,
  showCutOrder,
  onZoomIn,
  onZoomOut,
  onResetView,
}: SVGPreviewProps) {
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
          <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 18, fontWeight: 700 }}>SVG Preview</h2>
          <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 13 }}>Placeholder vector output for the final laser-ready layout.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { label: "Zoom In", handler: onZoomIn },
            { label: "Zoom Out", handler: onZoomOut },
            { label: "Fit Screen", handler: onResetView },
          ].map(({ label, handler }) => (
            <button key={label} type="button" onClick={handler} style={{ border: "1px solid rgba(34, 211, 238, 0.24)", borderRadius: 999, padding: "8px 12px", background: "rgba(34, 211, 238, 0.12)", color: "#a5f3fc", cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, borderRadius: 22, overflow: "hidden", border: "1px solid rgba(148, 163, 184, 0.16)", background: "#020617", padding: 12 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, color: "#94a3b8", fontSize: 12 }}>
          <span>Zoom: {zoom.toFixed(0)}%</span>
          <span>•</span>
          <span>{showGrid ? "Grid visible" : "Grid hidden"}</span>
          <span>•</span>
          <span>{showPartNumbers ? "Part numbers" : "No part numbers"}</span>
        </div>
        <div style={{ borderRadius: 16, background: "radial-gradient(circle at top, rgba(56, 189, 248, 0.1), rgba(2, 6, 23, 0.95))", padding: 10 }}>
          <svg viewBox="0 0 620 420" style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x="40" y="40" width="540" height="340" rx="24" fill="#111827" stroke="#38bdf8" strokeWidth="2" opacity="0.9" />
            {showGrid && <g stroke="#334155" strokeWidth="1"><path d="M80 40V380" /><path d="M140 40V380" /><path d="M200 40V380" /><path d="M260 40V380" /><path d="M320 40V380" /><path d="M380 40V380" /><path d="M440 40V380" /><path d="M500 40V380" /><path d="M40 80H580" /><path d="M40 140H580" /><path d="M40 200H580" /><path d="M40 260H580" /><path d="M40 320H580" /></g>}
            <rect x="120" y="100" width="180" height="140" rx="16" fill="#0f766e" stroke="#2dd4bf" strokeWidth="2" />
            <rect x="340" y="100" width="160" height="120" rx="16" fill="#92400e" stroke="#f59e0b" strokeWidth="2" />
            <rect x="180" y="270" width="220" height="80" rx="16" fill="#7c3aed" stroke="#a78bfa" strokeWidth="2" />
            {showSlots && <g stroke="#f43f5e" strokeWidth="2" strokeDasharray="6 6"><rect x="160" y="88" width="60" height="30" rx="8" fill="none" /><rect x="405" y="88" width="56" height="30" rx="8" fill="none" /></g>}
            {showPartNumbers && <g fill="#f8fafc" fontSize="14" fontFamily="Arial"><text x="135" y="92">P-01</text><text x="355" y="92">P-02</text><text x="210" y="262">P-03</text></g>}
            {showCutOrder && <g fill="#fde68a" fontSize="13" fontFamily="Arial"><text x="120" y="72">Cut 1</text><text x="340" y="72">Cut 2</text><text x="180" y="252">Cut 3</text></g>}
            <path d="M120 100 L500 100" stroke="#fb923c" strokeWidth="3" strokeLinecap="round" />
            <path d="M120 240 L500 240" stroke="#fb923c" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </section>
  );
}
