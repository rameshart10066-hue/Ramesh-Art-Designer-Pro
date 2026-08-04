"use client";

import { COLORS } from "../theme";

interface Tip {
  icon: string;
  title: string;
  body: string;
}

const TIPS: Tip[] = [
  {
    icon: "📷",
    title: "Photo → CAD",
    body: "Upload a customer photo in the Vision tab. The AI detects Ganpati components and reconstructs them as editable objects.",
  },
  {
    icon: "🏛",
    title: "Start from templates",
    body: "Pick a pre-built parametric decoration (Ganpati, Mandap, Stage…) and customize every dimension.",
  },
  {
    icon: "⌨️",
    title: "Keyboard shortcuts",
    body: "Ctrl+Z undo, Ctrl+D duplicate, Space to pan, arrow keys to nudge — the same canvas shortcuts you know from design tools.",
  },
  {
    icon: "🏭",
    title: "Manufacturing in one click",
    body: "The Manufacturing tab auto-generates sheets, part numbers, glue tabs, BOM, cost estimate and DXF/SVG export.",
  },
  {
    icon: "💾",
    title: "Autosave is on",
    body: "Your work is saved locally every minute. Recover it from the .radp backups stored on this device.",
  },
];

interface QuickTipsPanelProps {
  onDismiss: () => void;
}

/**
 * Quick reference cards for new users. Dismissing hides the panel until it is
 * re-enabled from Settings.
 */
export function QuickTipsPanel({ onDismiss }: QuickTipsPanelProps) {
  return (
    <section
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 18px",
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: COLORS.text }}>Quick Tips</h2>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          title="Hide tips (re-enable in Settings)"
          style={{
            border: "none",
            background: "transparent",
            color: COLORS.textDim,
            fontSize: 12,
            cursor: "pointer",
            padding: "4px 6px",
            borderRadius: 6,
          }}
        >
          Hide ✕
        </button>
      </div>

      <div style={{ padding: "6px 18px 14px" }}>
        {TIPS.map((tip) => (
          <div
            key={tip.title}
            style={{
              display: "flex",
              gap: 12,
              padding: "12px 0",
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 17,
                background: `${COLORS.indigo}1f`,
                border: `1px solid ${COLORS.indigo}33`,
              }}
            >
              {tip.icon}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{tip.title}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.5, marginTop: 2 }}>{tip.body}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
