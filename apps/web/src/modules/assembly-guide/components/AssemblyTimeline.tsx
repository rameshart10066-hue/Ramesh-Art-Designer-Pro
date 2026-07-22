type AssemblyTimelineProps = {
  steps: Array<{ step: string; label: string; active?: boolean }>;
};

export function AssemblyTimeline({ steps }: AssemblyTimelineProps) {
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
      <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 18, fontWeight: 700 }}>Assembly Timeline</h2>
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {steps.map((item) => (
          <div key={item.step} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 14, background: item.active ? "rgba(34, 211, 238, 0.12)" : "rgba(15, 23, 42, 0.72)" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: item.active ? "#22d3ee" : "rgba(148, 163, 184, 0.2)", color: item.active ? "#020617" : "#f8fafc", fontWeight: 800 }}>{item.step}</div>
            <div style={{ color: "#f8fafc", fontWeight: 700 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
