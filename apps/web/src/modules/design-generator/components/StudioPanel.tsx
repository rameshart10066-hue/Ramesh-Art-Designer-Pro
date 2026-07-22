import type { CSSProperties, ReactNode } from "react";

interface StudioPanelProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

interface StudioActionButtonProps {
  label: string;
  icon: string;
  active?: boolean;
  onClick?: () => void;
}

const panelStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: 20,
  background: "linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(15, 23, 42, 0.95))",
  boxShadow: "0 20px 50px rgba(2, 8, 23, 0.26)",
  padding: 18,
};

export function StudioPanel({ title, subtitle, children }: StudioPanelProps) {
  return (
    <section style={panelStyle}>
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ margin: 0, color: "#f8fafc", fontSize: 15, fontWeight: 700 }}>{title}</h3>
        {subtitle ? <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 12 }}>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function StudioActionButton({ label, icon, active = false, onClick }: StudioActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? "1px solid rgba(79, 70, 229, 0.45)" : "1px solid rgba(148, 163, 184, 0.16)",
        borderRadius: 999,
        padding: "9px 12px",
        color: active ? "#f8fafc" : "#cbd5e1",
        background: active ? "linear-gradient(135deg, #4f46e5, #3b82f6)" : "rgba(15, 23, 42, 0.82)",
        cursor: "pointer",
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
