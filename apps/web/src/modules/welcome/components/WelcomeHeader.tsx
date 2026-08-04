"use client";

import { APP_NAME, APP_TAGLINE, APP_VERSION, BUILD_LABEL } from "@/version";
import { COLORS } from "../theme";

/**
 * Landing header — brand title, tagline and version badge.
 * Full-bleed section with a subtle radial glow behind the title.
 */
export function WelcomeHeader() {
  return (
    <header
      style={{
        position: "relative",
        padding: "56px 24px 36px",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {/* Soft glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -120,
          left: "50%",
          transform: "translateX(-50%)",
          width: 720,
          height: 320,
          background: "radial-gradient(closest-side, rgba(99, 102, 241, 0.16), transparent)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative" }}>
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: COLORS.textDim,
            fontWeight: 700,
          }}
        >
          Welcome to
        </div>
        <h1
          style={{
            margin: "14px 0 10px",
            fontSize: "clamp(30px, 4.5vw, 46px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
          }}
        >
          <span
            style={{
              background: `linear-gradient(90deg, ${COLORS.accentLight}, #a78bfa, #f472b6)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {APP_NAME}
          </span>
        </h1>
        <p style={{ margin: 0, fontSize: 16, color: COLORS.textMuted }}>{APP_TAGLINE}</p>
        <div
          style={{
            marginTop: 16,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 999,
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            fontSize: 12,
            color: COLORS.textMuted,
            fontFamily: "monospace",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: COLORS.success,
              boxShadow: `0 0 8px ${COLORS.success}`,
            }}
          />
          v{APP_VERSION} · {BUILD_LABEL}
        </div>
      </div>
    </header>
  );
}
