"use client";

/**
 * Professional Status Bar — zoom, coordinates, selection info, document size
 */

import { useEditorStoreV2 } from "@/stores/editorStoreV2";

export function StatusBar() {
  const zoom = useEditorStoreV2((s) => s.zoom);
  const objects = useEditorStoreV2((s) => s.objects);
  const selectedIds = useEditorStoreV2((s) => s.selectedIds);
  const activeTool = useEditorStoreV2((s) => s.activeTool);
  const showGrid = useEditorStoreV2((s) => s.showGrid);
  const snapToGrid = useEditorStoreV2((s) => s.snapToGrid);
  const snapToObjects = useEditorStoreV2((s) => s.snapToObjects);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 16px",
        background: "#0f172a",
        borderTop: "1px solid #1e293b",
        fontSize: 12,
        color: "#64748b",
        userSelect: "none",
        minHeight: 28,
      }}
    >
      {/* Left: selection info */}
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <span>
          {selectedIds.length === 0
            ? "No selection"
            : selectedIds.length === 1
              ? "1 object selected"
              : `${selectedIds.length} objects selected`}
        </span>
        <span style={{ color: "#334155" }}>|</span>
        <span>{objects.length} objects</span>
        <span style={{ color: "#334155" }}>|</span>
        <span>Tool: {activeTool}</span>
      </div>

      {/* Right: zoom, grid, snap */}
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <span>Grid: {showGrid ? "ON" : "OFF"}</span>
        <span>Snap: {snapToGrid ? "Grid" : snapToObjects ? "Obj" : "OFF"}</span>
        <span style={{ color: "#334155" }}>|</span>
        <span style={{ fontWeight: 600, color: "#94a3b8", fontFamily: "monospace" }}>
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
}
