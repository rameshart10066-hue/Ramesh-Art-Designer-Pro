interface ExportButtonsProps {
  buttons: Array<{ label: string; icon: string }>;
}

export function ExportButtons({ buttons }: ExportButtonsProps) {
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
      <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 16, fontWeight: 700 }}>Export & Actions</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
        {buttons.map((button) => (
          <button key={button.label} type="button" style={{ border: 0, borderRadius: 999, padding: "10px 14px", background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            {button.icon} {button.label}
          </button>
        ))}
      </div>
    </section>
  );
}
