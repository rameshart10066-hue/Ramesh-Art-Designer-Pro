interface TimelineStep {
  label: string;
  status: "done" | "waiting";
}

interface TimelineProps {
  steps: TimelineStep[];
}

export function Timeline({ steps }: TimelineProps) {
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
      <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 16, fontWeight: 700 }}>Production Timeline</h2>
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {steps.map((step, index) => (
          <div key={step.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", borderRadius: 14, background: "rgba(15, 23, 42, 0.8)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: step.status === "done" ? "rgba(34, 197, 82, 0.2)" : "rgba(148, 163, 184, 0.18)", color: step.status === "done" ? "#22c55e" : "#94a3b8", fontWeight: 700 }}>
                {index + 1}
              </div>
              <div>
                <p style={{ margin: 0, color: "#f8fafc", fontWeight: 700 }}>{step.label}</p>
              </div>
            </div>
            <span style={{ color: step.status === "done" ? "#22c55e" : "#f59e0b", fontWeight: 700 }}>{step.status === "done" ? "✔" : "Waiting"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
