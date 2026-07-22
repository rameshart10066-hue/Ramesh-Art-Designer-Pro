import type { CSSProperties, ReactNode } from "react";

interface NavItem {
  key: string;
  label: string;
  icon: string;
  active?: boolean;
}

interface SidebarNavProps {
  items: NavItem[];
}

const navButtonStyle = (active: boolean): CSSProperties => ({
  width: "100%",
  border: 0,
  borderRadius: 14,
  padding: "12px 14px",
  display: "flex",
  alignItems: "center",
  gap: 12,
  cursor: "pointer",
  textAlign: "left",
  fontSize: 14,
  fontWeight: 700,
  color: active ? "#ffffff" : "#94a3b8",
  background: active ? "linear-gradient(135deg, rgba(79, 70, 229, 0.95), rgba(59, 130, 246, 0.9))" : "transparent",
  boxShadow: active ? "0 12px 24px rgba(79, 70, 229, 0.28)" : "none",
});

export function SidebarNav({ items }: SidebarNavProps) {
  return (
    <aside
      style={{
        border: "1px solid rgba(148, 163, 184, 0.16)",
        borderRadius: 24,
        padding: 18,
        background: "linear-gradient(180deg, rgba(17, 24, 39, 0.98), rgba(15, 23, 42, 0.96))",
        boxShadow: "0 24px 60px rgba(2, 8, 23, 0.28)",
        minHeight: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
            color: "#fff",
            fontWeight: 800,
          }}
        >
          RA
        </div>
        <div>
          <p style={{ margin: 0, color: "#f8fafc", fontWeight: 700 }}>RAMESH</p>
          <p style={{ margin: 0, color: "#64748b", fontSize: 12 }}>Operations Suite</p>
        </div>
      </div>

      <nav aria-label="Dashboard navigation" style={{ display: "grid", gap: 8 }}>
        {items.map((item) => (
          <button key={item.key} type="button" style={navButtonStyle(Boolean(item.active))}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
