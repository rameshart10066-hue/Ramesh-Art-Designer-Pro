import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function SectionCard({ title, subtitle, action, children }: SectionCardProps) {
  return (
    <section
      style={{
        border: "1px solid rgba(148, 163, 184, 0.18)",
        borderRadius: 24,
        background: "linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.94))",
        boxShadow: "0 24px 60px rgba(2, 8, 23, 0.38)",
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 18, fontWeight: 700 }}>{title}</h2>
          {subtitle ? (
            <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 13 }}>{subtitle}</p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
