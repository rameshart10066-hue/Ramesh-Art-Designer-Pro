"use client";

import { useMemo } from "react";
import type { CatalogItem } from "../catalogService";
import {
  CATEGORY_LABELS,
  SIZE_LABELS,
  THEME_LABELS,
  renderObjectsPreviewSvg,
  resolveItemObjects,
} from "../catalogService";

const C = {
  border: "#1e293b",
  borderStrong: "#334155",
  surface: "#0f172a",
  surface2: "#1e293b",
  text: "#f8fafc",
  muted: "#94a3b8",
  dim: "#64748b",
  accent: "#3b82f6",
  heart: "#ec4899",
  danger: "#ef4444",
};

interface CatalogCardProps {
  item: CatalogItem;
  onOpen: (item: CatalogItem) => void;
  onPreview3D: (item: CatalogItem) => void;
  onDuplicate: (item: CatalogItem) => void;
  onManufacture: (item: CatalogItem) => void;
  onDelete: (item: CatalogItem) => void;
  onToggleFavorite: (item: CatalogItem) => void;
}

/** One catalog design card: lazy SVG preview, metadata badges and actions. */
export function CatalogCard({
  item,
  onOpen,
  onPreview3D,
  onDuplicate,
  onManufacture,
  onDelete,
  onToggleFavorite,
}: CatalogCardProps) {
  const previewSvg = useMemo(() => renderObjectsPreviewSvg(resolveItemObjects(item)), [item]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRadius: 14,
        border: `1px solid ${C.border}`,
        background: C.surface,
        overflow: "hidden",
        transition: "border-color 0.12s ease, transform 0.12s ease, box-shadow 0.12s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.borderStrong;
        e.currentTarget.style.boxShadow = "0 10px 28px rgba(0,0,0,0.35)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.boxShadow = "";
      }}
    >
      {/* Preview */}
      <div style={{ position: "relative", flex: 1, minHeight: 0, background: "#0b1120" }}>
        <div
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          dangerouslySetInnerHTML={{ __html: previewSvg }}
        />
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            fontSize: 20,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
          }}
        >
          {item.icon}
        </div>
        <button
          type="button"
          onClick={() => onToggleFavorite(item)}
          title={item.favorite ? "Remove from favorites" : "Add to favorites"}
          aria-label={item.favorite ? "Remove from favorites" : "Add to favorites"}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: `1px solid ${item.favorite ? C.heart : C.borderStrong}`,
            background: item.favorite ? "rgba(236,72,153,0.18)" : "rgba(15,23,42,0.7)",
            color: item.favorite ? C.heart : C.dim,
            cursor: "pointer",
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {item.favorite ? "♥" : "♡"}
        </button>
      </div>

      {/* Info */}
      <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.name}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <Badge>{CATEGORY_LABELS[item.category] ?? item.category}</Badge>
          <Badge tone="blue">{SIZE_LABELS[item.size]}</Badge>
          <Badge tone="violet">{THEME_LABELS[item.theme] ?? item.theme}</Badge>
          <Badge tone="gold">
            <span style={{ letterSpacing: 1 }}>{"★".repeat(item.complexity)}{"☆".repeat(5 - item.complexity)}</span>
          </Badge>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
          <button type="button" onClick={() => onOpen(item)} title="Open in Design Studio" style={{ ...actionBtn, flex: 1, background: C.accent, borderColor: C.accent, color: "#fff" }}>
            Open
          </button>
          <IconBtn title="3D preview" onClick={() => onPreview3D(item)}>🧊</IconBtn>
          <IconBtn title="Duplicate design" onClick={() => onDuplicate(item)}>⧉</IconBtn>
          <IconBtn title="Manufacture" onClick={() => onManufacture(item)}>🏭</IconBtn>
          <IconBtn title="Delete from catalog" onClick={() => onDelete(item)} danger>🗑</IconBtn>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "blue" | "violet" | "gold" }) {
  const colors: Record<string, { fg: string; bg: string }> = {
    default: { fg: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
    blue: { fg: "#60a5fa", bg: "rgba(59,130,246,0.12)" },
    violet: { fg: "#a78bfa", bg: "rgba(139,92,246,0.12)" },
    gold: { fg: "#fbbf24", bg: "rgba(245,158,11,0.12)" },
  };
  const c = colors[tone]!;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: 999,
        color: c.fg,
        background: c.bg,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        border: `1px solid ${C.borderStrong}`,
        background: C.surface2,
        color: danger ? C.danger : C.muted,
        cursor: "pointer",
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

const actionBtn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${C.borderStrong}`,
  background: C.surface2,
  color: C.text,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
