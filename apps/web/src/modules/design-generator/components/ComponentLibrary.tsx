"use client";

import { useState, useMemo, useCallback } from "react";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";
import { COMPONENT_CATEGORIES } from "@/types/components";
import { COMPONENT_REGISTRY, searchComponents, getComponentsByCategory } from "@/services/editor/componentRegistry";
import type { ComponentDef } from "@/types/components";

/** LocalStorage key for favorites */
const FAVORITES_KEY = "ramesh-component-favorites";

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveFavorites(ids: string[]) {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids)); } catch {}
}

export default function ComponentLibrary() {
  const addObject = useEditorStoreV2((state) => state.addObject);
  const [activeCategory, setActiveCategory] = useState<string>("frames");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const [recent, setRecent] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("ramesh-component-recent") || "[]"); }
    catch { return []; }
  });

  // Compute displayed components
  const displayedComponents = useMemo(() => {
    if (searchQuery.trim()) {
      return searchComponents(searchQuery);
    }
    if (activeCategory === "favorites") {
      return COMPONENT_REGISTRY.filter((c) => favorites.includes(c.label));
    }
    if (activeCategory === "recent") {
      return COMPONENT_REGISTRY.filter((c) => recent.includes(c.label));
    }
    return getComponentsByCategory(activeCategory);
  }, [activeCategory, searchQuery, favorites, recent]);

  const addToRecent = useCallback((label: string) => {
    const updated = [label, ...recent.filter((r) => r !== label)].slice(0, 20);
    setRecent(updated);
    try { localStorage.setItem("ramesh-component-recent", JSON.stringify(updated)); } catch {}
  }, [recent]);

  const toggleFavorite = useCallback((label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(label)
      ? favorites.filter((f) => f !== label)
      : [...favorites, label];
    setFavorites(updated);
    saveFavorites(updated);
  }, [favorites]);

  function addComponent(comp: ComponentDef) {
    const fill = comp.defaultFill || (activeCategory === "frames" || activeCategory === "borders" || activeCategory === "backgrounds" ? "transparent" : "#3b82f6");
    addObject({
      type: comp.type as any,
      name: comp.label,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: comp.defaultWidth,
      height: comp.defaultHeight,
      fill: fill,
      stroke: comp.defaultStroke || "#1e40af",
      strokeWidth: 2,
      metadata: Object.fromEntries(
        comp.params
          .filter((p) => p.key.startsWith("metadata."))
          .map((p) => [p.key.replace("metadata.", ""), p.default]),
      ),
      ...(comp.params.find((p) => p.key === "cornerRadius")?.default !== undefined
        ? { cornerRadius: comp.params.find((p) => p.key === "cornerRadius")!.default as number }
        : {}),
    });
    addToRecent(comp.label);
  }

  return (
    <div
      style={{
        width: 280,
        background: "#111827",
        color: "white",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRight: "1px solid #374151",
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px 16px 8px", borderBottom: "1px solid #374151" }}>
        <h2 style={{ margin: 0, fontSize: 16, marginBottom: 6 }}>Component Library</h2>
        <input
          type="text"
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #374151",
            background: "#1f2937",
            color: "white",
            fontSize: 13,
            outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
          onBlur={(e) => (e.target.style.borderColor = "#374151")}
        />
      </div>

      {/* Categories */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, padding: "8px 10px", borderBottom: "1px solid #374151", overflow: "auto" }}>
        <CategoryChip label="⭐ Favorites" id="favorites" active={activeCategory} onClick={setActiveCategory} />
        <CategoryChip label="🕐 Recent" id="recent" active={activeCategory} onClick={setActiveCategory} />
        {COMPONENT_CATEGORIES.map((cat) => (
          <CategoryChip key={cat.id} label={`${cat.icon} ${cat.label}`} id={cat.id} active={activeCategory} onClick={setActiveCategory} />
        ))}
      </div>

      {/* Component List */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {displayedComponents.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6B7280", fontSize: 14 }}>
            {searchQuery ? "No components match your search" : "No components in this category"}
          </div>
        ) : (
          displayedComponents.map((comp) => (
            <div
              key={`${comp.type}-${comp.label}`}
              onClick={() => addComponent(comp)}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("component-type", comp.type);
                e.dataTransfer.setData("component-label", comp.label);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                cursor: "pointer",
                borderBottom: "1px solid #1f2937",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#1f2937"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>
                {comp.icon || "📦"}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {comp.label}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {comp.description}
                </div>
              </div>
              <button
                onClick={(e) => toggleFavorite(comp.label, e)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 2, flexShrink: 0 }}
                title={favorites.includes(comp.label) ? "Remove from favorites" : "Add to favorites"}
              >
                {favorites.includes(comp.label) ? "★" : "☆"}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer count */}
      <div style={{ padding: "6px 14px", borderTop: "1px solid #374151", fontSize: 11, color: "#64748b" }}>
        {COMPONENT_REGISTRY.length} components
      </div>
    </div>
  );
}

function CategoryChip({ label, id, active, onClick }: { label: string; id: string; active: string; onClick: (id: string) => void }) {
  const isActive = active === id;
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        padding: "4px 8px",
        fontSize: 11,
        borderRadius: 4,
        border: "none",
        background: isActive ? "rgba(59,130,246,0.2)" : "#1f2937",
        color: isActive ? "#60a5fa" : "#94a3b8",
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontWeight: isActive ? 600 : 400,
      }}
    >
      {label}
    </button>
  );
}
