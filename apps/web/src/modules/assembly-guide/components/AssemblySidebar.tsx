type AssemblySidebarProps = {
  items: string[];
  selected: string;
  onSelect: (item: string) => void;
};

export function AssemblySidebar({ items, selected, onSelect }: AssemblySidebarProps) {
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
      <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 18, fontWeight: 700 }}>Assembly Navigation</h2>
      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        {items.map((item) => {
          const isSelected = item === selected;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              style={{
                textAlign: "left",
                border: isSelected ? "1px solid rgba(34, 211, 238, 0.28)" : "1px solid rgba(148, 163, 184, 0.14)",
                borderRadius: 14,
                padding: "10px 12px",
                background: isSelected ? "rgba(34, 211, 238, 0.12)" : "rgba(15, 23, 42, 0.72)",
                color: isSelected ? "#a5f3fc" : "#f8fafc",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {item}
            </button>
          );
        })}
      </div>
    </section>
  );
}
