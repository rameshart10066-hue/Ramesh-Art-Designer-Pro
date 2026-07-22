export function ActionButtons() {
  const buttons = [
    { label: "Generate PDF Guide" },
    { label: "Print Guide" },
    { label: "Export Images" },
    { label: "Export Part List" },
    { label: "Mark Completed" },
  ];

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {buttons.map((button) => (
        <button
          key={button.label}
          type="button"
          style={{
            border: "1px solid rgba(34, 211, 238, 0.24)",
            borderRadius: 999,
            padding: "10px 14px",
            background: "rgba(34, 211, 238, 0.12)",
            color: "#a5f3fc",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}
