type AssemblyCanvasProps = {
  currentStep: number;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onFit: () => void;
};

export function AssemblyCanvas({ currentStep, onPrev, onNext, onZoomIn, onZoomOut, onRotate, onFit }: AssemblyCanvasProps) {
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
          <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 18, fontWeight: 700 }}>Assembly Preview</h2>
          <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 13 }}>Step {currentStep} • placeholder illustration with highlighted connections.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={onPrev} style={{ border: "1px solid rgba(34, 211, 238, 0.24)", borderRadius: 999, padding: "8px 12px", background: "rgba(34, 211, 238, 0.12)", color: "#a5f3fc", cursor: "pointer" }}>Previous Step</button>
          <button type="button" onClick={onNext} style={{ border: "1px solid rgba(34, 211, 238, 0.24)", borderRadius: 999, padding: "8px 12px", background: "rgba(34, 211, 238, 0.12)", color: "#a5f3fc", cursor: "pointer" }}>Next Step</button>
          <button type="button" onClick={onZoomIn} style={{ border: "1px solid rgba(34, 211, 238, 0.24)", borderRadius: 999, padding: "8px 12px", background: "rgba(34, 211, 238, 0.12)", color: "#a5f3fc", cursor: "pointer" }}>Zoom In</button>
          <button type="button" onClick={onZoomOut} style={{ border: "1px solid rgba(34, 211, 238, 0.24)", borderRadius: 999, padding: "8px 12px", background: "rgba(34, 211, 238, 0.12)", color: "#a5f3fc", cursor: "pointer" }}>Zoom Out</button>
          <button type="button" onClick={onRotate} style={{ border: "1px solid rgba(34, 211, 238, 0.24)", borderRadius: 999, padding: "8px 12px", background: "rgba(34, 211, 238, 0.12)", color: "#a5f3fc", cursor: "pointer" }}>Rotate</button>
          <button type="button" onClick={onFit} style={{ border: "1px solid rgba(34, 211, 238, 0.24)", borderRadius: 999, padding: "8px 12px", background: "rgba(34, 211, 238, 0.12)", color: "#a5f3fc", cursor: "pointer" }}>Fit Screen</button>
        </div>
      </div>

      <div style={{ marginTop: 16, borderRadius: 22, overflow: "hidden", border: "1px solid rgba(148, 163, 184, 0.16)", background: "#020617", padding: 12 }}>
        <svg viewBox="0 0 620 420" style={{ width: "100%", height: "auto", display: "block" }}>
          <rect x="40" y="40" width="540" height="340" rx="24" fill="#111827" stroke="#38bdf8" strokeWidth="2" />
          <rect x="140" y="130" width="180" height="140" rx="16" fill="#0f766e" stroke="#2dd4bf" strokeWidth="2" />
          <rect x="350" y="130" width="150" height="120" rx="16" fill="#92400e" stroke="#f59e0b" strokeWidth="2" />
          <rect x="220" y="300" width="180" height="40" rx="12" fill="#7c3aed" stroke="#a78bfa" strokeWidth="2" />
          <circle cx="250" cy="180" r="36" fill="#f8fafc" opacity="0.18" />
          <circle cx="430" cy="180" r="28" fill="#f8fafc" opacity="0.14" />
          <path d="M320 180 L350 180" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
          <path d="M220 180 L250 180" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
          <g fill="#f8fafc" fontSize="14" fontFamily="Arial">
            <text x="165" y="155">Base</text>
            <text x="372" y="155">Pillar</text>
            <text x="250" y="325">Halo</text>
          </g>
        </svg>
      </div>
    </section>
  );
}
