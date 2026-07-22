type StepDetailsProps = {
  stepNumber: string;
  description: string;
  requiredParts: string;
  requiredGlue: string;
  estimatedTime: string;
  warnings: string;
  tips: string;
  checklist: string[];
};

export function StepDetails({ stepNumber, description, requiredParts, requiredGlue, estimatedTime, warnings, tips, checklist }: StepDetailsProps) {
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
      <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 18, fontWeight: 700 }}>Current Step Details</h2>
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {[
          ["Step Number", stepNumber],
          ["Description", description],
          ["Required Parts", requiredParts],
          ["Required Glue", requiredGlue],
          ["Estimated Time", estimatedTime],
          ["Warnings", warnings],
          ["Tips", tips],
        ].map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "10px 12px", borderRadius: 14, background: "rgba(15, 23, 42, 0.72)" }}>
            <span style={{ color: "#94a3b8", fontSize: 12 }}>{label}</span>
            <span style={{ color: "#f8fafc", fontWeight: 700, textAlign: "right" }}>{value}</span>
          </div>
        ))}
        <div style={{ padding: "10px 12px", borderRadius: 14, background: "rgba(15, 23, 42, 0.72)" }}>
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8 }}>Checklist</div>
          <div style={{ display: "grid", gap: 8 }}>
            {checklist.map((item) => (
              <div key={item} style={{ color: "#f8fafc", fontWeight: 600 }}>{item}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
