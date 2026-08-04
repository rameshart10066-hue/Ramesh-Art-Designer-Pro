"use client";

import type { CatalogSize, CatalogTheme } from "../catalogService";
import { CATEGORY_LABELS, SIZE_LABELS, THEME_LABELS } from "../catalogService";

const C = {
  border: "#1e293b",
  borderStrong: "#334155",
  surface: "#0f172a",
  surface2: "#1e293b",
  text: "#f8fafc",
  muted: "#94a3b8",
  dim: "#64748b",
  accent: "#3b82f6",
};

const SIZE_OPTIONS: CatalogSize[] = ["3x3", "4x4", "5x5", "6x6", "custom"];
const THEME_OPTIONS: CatalogTheme[] = ["royal", "temple", "traditional", "modern", "minimal", "custom"];

interface CatalogToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categories: string[];
  category: string | null;
  onCategoryChange: (value: string | null) => void;
  size: CatalogSize | null;
  onSizeChange: (value: CatalogSize | null) => void;
  theme: CatalogTheme | null;
  onThemeChange: (value: CatalogTheme | null) => void;
  favoritesOnly: boolean;
  onFavoritesToggle: () => void;
  filteredCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onNewDesign: () => void;
}

export function CatalogToolbar(props: CatalogToolbarProps) {
  const { categories, category, onCategoryChange } = props;

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Row 1: search + quick actions */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="search"
          placeholder="Search designs…"
          value={props.search}
          onChange={(e) => props.onSearchChange(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: "9px 12px",
            borderRadius: 9,
            border: `1px solid ${C.borderStrong}`,
            background: "#0b1120",
            color: C.text,
            fontSize: 13,
            outline: "none",
          }}
        />
        <FilterPill
          active={props.favoritesOnly}
          onClick={props.onFavoritesToggle}
          label={props.favoritesOnly ? "♥ Favorites" : "♡ Favorites"}
        />
        <button
          type="button"
          onClick={props.onNewDesign}
          style={{
            padding: "9px 14px",
            borderRadius: 9,
            border: "none",
            background: C.accent,
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + New Design
        </button>
      </div>

      {/* Row 2: categories */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 1 }}>Category</span>
        <FilterPill active={category === null} onClick={() => onCategoryChange(null)} label="All" />
        {categories.map((cat) => (
          <FilterPill key={cat} active={category === cat} onClick={() => onCategoryChange(category === cat ? null : cat)} label={CATEGORY_LABELS[cat] ?? cat} />
        ))}
      </div>

      {/* Row 3: size + theme */}
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 1 }}>Size</span>
          <FilterPill active={props.size === null} onClick={() => props.onSizeChange(null)} label="All" />
          {SIZE_OPTIONS.map((s) => (
            <FilterPill key={s} active={props.size === s} onClick={() => props.onSizeChange(props.size === s ? null : s)} label={SIZE_LABELS[s]} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 1 }}>Theme</span>
          <FilterPill active={props.theme === null} onClick={() => props.onThemeChange(null)} label="All" />
          {THEME_OPTIONS.map((t) => (
            <FilterPill key={t} active={props.theme === t} onClick={() => props.onThemeChange(props.theme === t ? null : t)} label={THEME_LABELS[t]} />
          ))}
        </div>
      </div>

      {/* Row 4: results + clear */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: C.dim }}>
          {props.filteredCount} design{props.filteredCount === 1 ? "" : "s"}
        </span>
        {props.hasActiveFilters && (
          <button
            type="button"
            onClick={props.onClearFilters}
            style={{ border: "none", background: "transparent", color: C.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Clear filters ✕
          </button>
        )}
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        border: `1px solid ${active ? C.accent : C.borderStrong}`,
        background: active ? "rgba(59,130,246,0.16)" : C.surface2,
        color: active ? "#93c5fd" : C.muted,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}
