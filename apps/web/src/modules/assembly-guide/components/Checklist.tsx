type ChecklistProps = {
  items: string[];
};

export function Checklist({ items }: ChecklistProps) {
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
      <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 18, fontWeight: 700 }}>Checklist</h2>
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {items.map((item) => (
          <label key={item} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 14, background: "rgba(15, 23, 42, 0.72)", color: "#f8fafc", cursor: "pointer" }}>
            <input type="checkbox" style={{ accentColor: "#38bdf8", width: 16, height: 16 }} />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
