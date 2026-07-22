export function ExportButtons() {
  const buttons = [
    { label: "Auto Arrange" },
    { label: "Optimize Again" },
    { label: "Generate Final Layout" },
    { label: "Export SVG" },
    { label: "Export DXF", disabled: true },
    { label: "Export PNG" },
  ];

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {buttons.map((button) => (
        <button
          key={button.label}
          type="button"
          disabled={button.disabled}
          style={{
            border: button.disabled ? "1px solid rgba(148, 163, 184, 0.16)" : "1px solid rgba(34, 211, 238, 0.24)",
            borderRadius: 999,
            padding: "10px 14px",
            background: button.disabled ? "rgba(15, 23, 42, 0.72)" : "rgba(34, 211, 238, 0.12)",
            color: button.disabled ? "#64748b" : "#a5f3fc",
            cursor: button.disabled ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}
