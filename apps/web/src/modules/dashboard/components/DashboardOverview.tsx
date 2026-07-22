"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardSummary } from "@ramesh/api-contracts";
import { getDashboardSummary } from "@/services/dashboardService";
import { SummaryCard } from "./SummaryCard";
import { ModuleCard } from "./ModuleCard";
import { SectionCard } from "./SectionCard";
import { SidebarNav } from "./SidebarNav";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; summary: DashboardSummary };

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  padding: "24px 28px",
  borderRadius: 24,
  border: "1px solid rgba(148, 163, 184, 0.16)",
  background: "linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.92))",
  boxShadow: "0 24px 60px rgba(2, 8, 23, 0.3)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 220,
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: 999,
  padding: "10px 14px",
  color: "#f8fafc",
  background: "rgba(15, 23, 42, 0.8)",
};

/**
 * Top-level dashboard container. Owns data fetching and loading/error
 * state; delegates all rendering of individual items to SummaryCard and
 * ModuleCard so those stay reusable and independently testable.
 */
export function DashboardOverview() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    getDashboardSummary()
      .then((summary) => {
        if (!cancelled) setState({ status: "ready", summary });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Failed to load dashboard.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const metricCards = useMemo(() => {
    if (state.status !== "ready") {
      return null;
    }

    return state.summary.metrics.map((metric) => <SummaryCard key={metric.key} metric={metric} />);
  }, [state]);

  if (state.status === "loading") {
    return (
      <div style={{ padding: 20, color: "#f8fafc" }}>
        <div style={headerStyle}>Loading dashboard…</div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ ...headerStyle, color: "#fda4af" }} role="alert">
          {state.message}
        </div>
      </div>
    );
  }

  const { modules } = state.summary;

  return (
    <div style={{ padding: 20, background: "#020617", color: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0, 1fr)", gap: 20 }}>
        <SidebarNav
          items={[
            { key: "dashboard", label: "Dashboard", icon: "◉", active: true },
            { key: "design", label: "Design Studio", icon: "✦" },
            { key: "ai", label: "AI Designer", icon: "⚡" },
            { key: "orders", label: "Orders", icon: "▣" },
            { key: "manufacturing", label: "Manufacturing", icon: "⛭" },
            { key: "inventory", label: "Inventory", icon: "◫" },
            { key: "catalog", label: "Catalog", icon: "☰" },
            { key: "customers", label: "Customers", icon: "◌" },
            { key: "reports", label: "Reports", icon: "◍" },
            { key: "settings", label: "Settings", icon: "⚙" },
            { key: "logout", label: "Logout", icon: "⇢" },
          ]}
        />

        <div style={{ display: "grid", gap: 20 }}>
          <header style={headerStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  background: "linear-gradient(135deg, #38bdf8, #818cf8)",
                  color: "#fff",
                }}
              >
                RA
              </div>
              <div>
                <p style={{ margin: 0, color: "#38bdf8", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em" }}>
                  Good Morning, Karan 👋
                </p>
                <h1 style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 700 }}>Production Manager</h1>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
              <div style={{ minWidth: 240, flex: 1, maxWidth: 320 }}>
                <input aria-label="Search dashboard" placeholder="Search orders, designs, materials" style={inputStyle} />
              </div>
              <button style={{ border: "1px solid rgba(148, 163, 184, 0.18)", borderRadius: 999, padding: "10px 12px", background: "rgba(15, 23, 42, 0.8)", color: "#f8fafc" }}>
                🔔
              </button>
              <button style={{ border: "1px solid rgba(148, 163, 184, 0.18)", borderRadius: 999, padding: "10px 12px", background: "rgba(15, 23, 42, 0.8)", color: "#f8fafc" }}>
                📅
              </button>
              <button style={{ border: "1px solid rgba(148, 163, 184, 0.18)", borderRadius: 999, padding: "10px 12px", background: "rgba(15, 23, 42, 0.8)", color: "#f8fafc" }}>
                ☀︎
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
                  KP
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Karan Patel</p>
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>Production Manager</p>
                </div>
              </div>
            </div>
          </header>

          <section aria-label="Key metrics" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {metricCards}
          </section>

          <SectionCard title="Quick Actions" subtitle="Launch the most common workflows">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
              {modules.map((module) => (
                <ModuleCard key={module.key} module={module} />
              ))}
            </div>
          </SectionCard>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, alignItems: "start" }}>
            <div style={{ display: "grid", gap: 20 }}>
              <SectionCard title="Revenue Intelligence" subtitle="Live forecast across manufacturing lines">
                <div style={{ height: 220, borderRadius: 18, background: "linear-gradient(135deg, rgba(79,70,229,0.16), rgba(30,41,59,0.8))", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                  <div style={{ width: "80%", height: 120, borderBottom: "2px solid rgba(148,163,184,0.2)", position: "relative" }}>
                    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 100, background: "linear-gradient(180deg, rgba(79,70,229,0.35), transparent)", clipPath: "polygon(0% 100%, 10% 72%, 24% 78%, 38% 58%, 54% 64%, 68% 44%, 84% 50%, 100% 20%, 100% 100%)" }} />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Recent Orders" subtitle="Latest client requests and production status">
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", color: "#e2e8f0" }}>
                    <thead>
                      <tr style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        <th style={{ textAlign: "left", padding: "10px 8px" }}>Order</th>
                        <th style={{ textAlign: "left", padding: "10px 8px" }}>Customer</th>
                        <th style={{ textAlign: "left", padding: "10px 8px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["ORD-1024", "Acrylic Creations", "In Production"],
                        ["ORD-1019", "Brandline Studio", "Pending"],
                        ["ORD-1012", "Nova Signage", "Completed"],
                      ].map(([order, customer, status]) => (
                        <tr key={order} style={{ borderTop: "1px solid rgba(148, 163, 184, 0.14)" }}>
                          <td style={{ padding: "12px 8px", fontWeight: 600 }}>{order}</td>
                          <td style={{ padding: "12px 8px", color: "#94a3b8" }}>{customer}</td>
                          <td style={{ padding: "12px 8px" }}>
                            <span
                              style={{
                                padding: "6px 10px",
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 700,
                                background: status === "Completed" ? "#164e63" : status === "In Production" ? "#422006" : "#1f2937",
                                color: status === "Completed" ? "#67e8f9" : status === "In Production" ? "#fde68a" : "#e2e8f0",
                              }}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>

            <div style={{ display: "grid", gap: 20 }}>
              <SectionCard title="Factory Status" subtitle="Machine and line health">
                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    ["Laser 1", "Running", "#22c55e"],
                    ["Laser 2", "Idle", "#f59e0b"],
                    ["CNC", "Maintenance", "#ef4444"],
                    ["Printer", "Running", "#22c55e"],
                  ].map(([name, state, color]) => (
                    <div key={name} style={{ padding: 12, borderRadius: 16, background: "rgba(15, 23, 42, 0.72)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ margin: 0, color: "#f8fafc", fontWeight: 700 }}>{name}</p>
                        <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 13 }}>{state}</p>
                      </div>
                      <span style={{ width: 12, height: 12, borderRadius: "50%", background: color }} />
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Production Queue" subtitle="Priority batches in motion">
                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    ["Laser Cutting", "3 jobs pending", 78],
                    ["Printing", "2 jobs pending", 61],
                    ["Assembly", "1 urgent batch", 92],
                  ].map(([title, detail, progress]) => (
                    <div key={title} style={{ padding: 12, borderRadius: 16, background: "rgba(15, 23, 42, 0.72)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <p style={{ margin: 0, color: "#f8fafc", fontWeight: 700 }}>{title}</p>
                        <span style={{ color: "#38bdf8", fontSize: 12, fontWeight: 700 }}>{progress}%</span>
                      </div>
                      <div style={{ width: "100%", height: 8, borderRadius: 999, background: "rgba(148,163,184,0.16)" }}>
                        <div style={{ width: `${progress}%`, height: 8, borderRadius: 999, background: "linear-gradient(90deg, #4f46e5, #3b82f6)" }} />
                      </div>
                      <p style={{ margin: "8px 0 0", color: "#94a3b8", fontSize: 13 }}>{detail}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 }}>
            <SectionCard title="Material Alerts" subtitle="Inventory items requiring attention">
              <div style={{ display: "grid", gap: 12 }}>
                {[
                  ["Acrylic Sheet 3mm", "Low stock", "warning"],
                  ["Aluminum Frame", "Critical", "danger"],
                  ["Adhesive Film", "Out of stock", "info"],
                ].map(([title, detail, tone]) => (
                  <div key={title} style={{ padding: 12, borderRadius: 16, background: "rgba(15, 23, 42, 0.72)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ margin: 0, color: "#f8fafc", fontWeight: 700 }}>{title}</p>
                      <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 13 }}>{detail}</p>
                    </div>
                    <span
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        background: tone === "danger" ? "rgba(239,68,68,0.16)" : tone === "warning" ? "rgba(245,158,11,0.16)" : "rgba(59,130,246,0.16)",
                        color: tone === "danger" ? "#fca5a5" : tone === "warning" ? "#fde68a" : "#93c5fd",
                      }}
                    >
                      {tone === "danger" ? "Critical" : tone === "warning" ? "Low" : "Info"}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="AI Assistant" subtitle="Design generation and estimation support">
              <div style={{ border: "1px solid rgba(148,163,184,0.14)", borderRadius: 18, padding: 16, background: "rgba(15,23,42,0.72)" }}>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>Describe the decoration you want…</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                  {[
                    ["Generate Design", "#4f46e5"],
                    ["Generate SVG", "#3b82f6"],
                    ["Estimate Cost", "#22c55e"],
                    ["Estimate Time", "#f59e0b"],
                  ].map(([label, color]) => (
                    <button key={label} style={{ border: 0, borderRadius: 999, padding: "10px 14px", color: "#fff", background: color, cursor: "pointer", fontWeight: 700 }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Bottom Metrics" subtitle="Operational pulse at a glance">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
              {[
                ["Employees Working", "42"],
                ["Machines Running", "8/12"],
                ["Material Used", "86%"],
                ["Profit Margin", "24%"],
                ["Customer Rating", "4.9/5"],
              ].map(([title, value]) => (
                <div key={title} style={{ padding: 16, borderRadius: 18, background: "rgba(15, 23, 42, 0.72)" }}>
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>{title}</p>
                  <p style={{ margin: "8px 0 0", color: "#f8fafc", fontSize: 24, fontWeight: 700 }}>{value}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
