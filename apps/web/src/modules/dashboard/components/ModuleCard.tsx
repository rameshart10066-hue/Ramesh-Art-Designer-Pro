import type { ModuleLink } from "@ramesh/api-contracts";

interface ModuleCardProps {
  module: ModuleLink;
}

const STATUS_LABEL: Record<ModuleLink["status"], string> = {
  available: "Available",
  "in-progress": "In progress",
  planned: "Planned",
};

const STATUS_COLORS: Record<ModuleLink["status"], string> = {
  available: "#34d399",
  "in-progress": "#f59e0b",
  planned: "#64748b",
};

const QUICK_ACTION_ICON: Record<string, string> = {
  newDesign: "✦",
  catalog: "🗂",
  manufacturing: "🏭",
  customers: "👥",
};

/** Presentation-only nav card for a single business module. */
export function ModuleCard({ module }: ModuleCardProps) {
  const isClickable = module.status === "available" || module.status === "in-progress";
  const icon = QUICK_ACTION_ICON[module.key] ?? "▣";

  const content = (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            color: STATUS_COLORS[module.status],
            background: `${STATUS_COLORS[module.status]}22`,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {STATUS_LABEL[module.status]}
        </span>
      </div>
      <p style={{ margin: "14px 0 6px", color: "#f8fafc", fontSize: 16, fontWeight: 700 }}>{module.label}</p>
      <p style={{ margin: 0, color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>{module.description}</p>
    </>
  );

  if (!isClickable) {
    return (
      <div
        data-testid={`module-card-${module.key}`}
        style={{
          border: "1px solid rgba(148, 163, 184, 0.16)",
          borderRadius: 20,
          padding: 18,
          background: "rgba(15, 23, 42, 0.72)",
          minHeight: 140,
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <a
      href={module.href}
      data-testid={`module-card-${module.key}`}
      style={{
        display: "block",
        border: "1px solid rgba(148, 163, 184, 0.16)",
        borderRadius: 20,
        padding: 18,
        background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))",
        minHeight: 140,
        textDecoration: "none",
        color: "inherit",
        boxShadow: "0 18px 40px rgba(2, 8, 23, 0.24)",
      }}
    >
      {content}
    </a>
  );
}
