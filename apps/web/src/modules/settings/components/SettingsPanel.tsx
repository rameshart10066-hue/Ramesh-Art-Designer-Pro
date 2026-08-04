"use client";

import type { ReactNode } from "react";
import { useAppSettingsStore } from "@/stores/appSettingsStore";
import { APP_NAME, APP_VERSION, BUILD_LABEL } from "@/version";

const COLORS = {
  bg: "#020617",
  surface: "#0f172a",
  surface2: "#1e293b",
  border: "#1e293b",
  text: "#f8fafc",
  textMuted: "#94a3b8",
  textDim: "#64748b",
  accent: "#3b82f6",
};

/**
 * Settings page — persisted via the app settings store. Changes apply
 * immediately; canvas defaults are picked up the next time the Design Studio
 * opens, and the welcome-screen panels toggle in real time.
 */
export function SettingsPanel() {
  const settings = useAppSettingsStore();
  const update = useAppSettingsStore((s) => s.updateSettings);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 24px 64px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>Settings</h1>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: COLORS.textMuted }}>
          Workspace preferences for {APP_NAME}. Saved automatically on this device.
        </p>
      </div>

      {/* ── General ─────────────────────────────────────── */}
      <Card title="General" icon="🖥">
        <Row
          title="Show Quick Tips"
          description="Display the tips panel on the Welcome Dashboard."
          control={<Toggle checked={settings.showQuickTips} onChange={(v) => update({ showQuickTips: v })} />}
        />
        <Row
          title="Show Recent Projects"
          description="Display the last-10 projects panel on the Welcome Dashboard."
          control={<Toggle checked={settings.showRecentProjects} onChange={(v) => update({ showRecentProjects: v })} />}
        />
      </Card>

      {/* ── Canvas ──────────────────────────────────────── */}
      <Card title="Canvas defaults" icon="🎨">
        <Row
          title="Grid size"
          description="Snap grid spacing applied when the Design Studio opens (px)."
          control={
            <NumberInput
              value={settings.gridSize}
              min={5}
              max={100}
              step={5}
              suffix="px"
              onChange={(v) => update({ gridSize: v })}
            />
          }
        />
        <Row
          title="Snap to grid by default"
          description="Enable snapping to the grid when the Design Studio opens."
          control={<Toggle checked={settings.snapToGrid} onChange={(v) => update({ snapToGrid: v })} />}
        />
      </Card>

      {/* ── Autosave ───────────────────────────────────── */}
      <Card title="Autosave & recovery" icon="💾">
        <Row
          title="Autosave"
          description="Automatically save the open project to this device while you work."
          control={<Toggle checked={settings.autosaveEnabled} onChange={(v) => update({ autosaveEnabled: v })} />}
        />
        <Row
          title="Autosave interval"
          description="How often the open project is saved."
          control={
            <NumberInput
              value={settings.autosaveIntervalMinutes}
              min={0.5}
              max={60}
              step={0.5}
              suffix="min"
              onChange={(v) => update({ autosaveIntervalMinutes: v })}
            />
          }
        />
      </Card>

      {/* ── About ───────────────────────────────────────── */}
      <Card title="About" icon="ℹ️">
        <Row title="Application" description={APP_NAME} />
        <Row title="Version" description={`v${APP_VERSION} · ${BUILD_LABEL}`} />
      </Card>
    </div>
  );
}

// ── Small building blocks ─────────────────────────────────────────

function Card({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <section
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 18px",
          borderBottom: `1px solid ${COLORS.border}`,
          fontSize: 14,
          fontWeight: 700,
          color: COLORS.text,
        }}
      >
        <span style={{ fontSize: 15 }}>{icon}</span>
        {title}
      </div>
      <div>{children}</div>
    </section>
  );
}

function Row({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "14px 18px",
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{title}</div>
        <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 2 }}>{description}</div>
      </div>
      {control && <div style={{ flexShrink: 0 }}>{control}</div>}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        background: checked ? COLORS.accent : COLORS.surface2,
        position: "relative",
        transition: "background 0.15s ease",
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.15s ease",
        }}
      />
    </button>
  );
}

function NumberInput({
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next)));
        }}
        style={{
          width: 80,
          padding: "7px 10px",
          borderRadius: 8,
          border: `1px solid ${COLORS.border}`,
          background: COLORS.bg,
          color: COLORS.text,
          fontSize: 13,
          fontFamily: "monospace",
          outline: "none",
        }}
      />
      <span style={{ fontSize: 12, color: COLORS.textDim }}>{suffix}</span>
    </div>
  );
}
