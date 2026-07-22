type SVGHeaderProps = {
  title: string;
  breadcrumb: string[];
};

export function SVGHeader({ title, breadcrumb }: SVGHeaderProps) {
  return (
    <section
      style={{
        border: "1px solid rgba(148, 163, 184, 0.16)",
        borderRadius: 24,
        padding: 24,
        background: "linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.98))",
        boxShadow: "0 25px 60px rgba(2, 8, 23, 0.28)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: "#38bdf8", fontSize: 12, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase" }}>
            {breadcrumb.join(" / ")}
          </div>
          <h1 style={{ margin: "8px 0 0", color: "#f8fafc", fontSize: 28, fontWeight: 800 }}>{title}</h1>
        </div>
        <div style={{ padding: "10px 14px", borderRadius: 999, background: "rgba(34, 211, 238, 0.12)", border: "1px solid rgba(34, 211, 238, 0.22)", color: "#a5f3fc" }}>
          Current Design • RA-205
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 18 }}>
        {[
          ["Design ID", "RA-205"],
          ["Material", "12 mm Thermocol"],
          ["Board Size", "39 × 19 inch"],
        ].map(([label, value]) => (
          <div key={label} style={{ padding: 14, borderRadius: 16, background: "rgba(15, 23, 42, 0.76)", border: "1px solid rgba(148, 163, 184, 0.14)" }}>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>{label}</div>
            <div style={{ color: "#f8fafc", fontWeight: 700, marginTop: 4 }}>{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
