"use client";

import type { ReactNode } from "react";
import { COLORS } from "../theme";

interface ActionCardProps {
  icon: string;
  title: string;
  description: string;
  /** Accent color used for the icon tile and hover ring. */
  accent: string;
  onClick: () => void;
  /** Optional secondary content rendered below the description. */
  footer?: ReactNode;
  disabled?: boolean;
}

/**
 * Large main-action card for the Welcome Dashboard.
 * Rendered as an accessible, focusable, keyboard-operable button.
 */
export function ActionCard({ icon, title, description, accent, onClick, footer, disabled }: ActionCardProps) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) onClick();
      }}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 20,
        borderRadius: 14,
        background: `linear-gradient(180deg, ${COLORS.surface} 0%, #0a0f1f 100%)`,
        border: `1px solid ${COLORS.border}`,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        position: "relative",
        transition: "transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
        outline: "none",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 12px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px ${accent}22`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = COLORS.border;
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = accent;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = COLORS.border;
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            background: `${accent}1f`,
            border: `1px solid ${accent}33`,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <span style={{ color: accent, fontSize: 18, lineHeight: 1, marginTop: 4 }}>→</span>
      </div>

      <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.text, letterSpacing: "-0.01em" }}>{title}</div>
      <div style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.55, flex: 1 }}>{description}</div>

      {footer}
    </div>
  );
}
