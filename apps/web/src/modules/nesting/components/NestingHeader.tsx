type NestingHeaderProps = {
  title: string;
  breadcrumb: string[];
};

export function NestingHeader({ title, breadcrumb }: NestingHeaderProps) {
  return (
    <section
      style={{
        border: "1px solid rgba(148, 163, 184, 0.16)",
        borderRadius: 24,
        padding: 24,
        background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.98))",
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
          Auto Nesting • Live Preview
        </div>
      </div>
    </section>
  );
}
