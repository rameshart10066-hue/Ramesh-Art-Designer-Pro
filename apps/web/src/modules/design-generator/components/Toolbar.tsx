"use client";

/**
 * Canvas Toolbar — tool selection palette
 * Provides select, shape, text, and pan tools
 */

import { useEditorStoreV2, type CanvasTool } from "@/stores/editorStoreV2";

interface ToolDef {
  id: CanvasTool;
  label: string;
  icon: string;
  shortcut: string;
}

const TOOLS: ToolDef[] = [
  { id: "select",    label: "Select",      icon: "⬆", shortcut: "V" },
  { id: "rectangle", label: "Rectangle",   icon: "▭", shortcut: "R" },
  { id: "circle",    label: "Circle",      icon: "○", shortcut: "C" },
  { id: "ellipse",   label: "Ellipse",     icon: "⬮", shortcut: "E" },
  { id: "star",      label: "Star",        icon: "⭐", shortcut: "S" },
  { id: "polygon",   label: "Polygon",     icon: "⬡", shortcut: "P" },
  { id: "line",      label: "Line",        icon: "╱", shortcut: "L" },
  { id: "text",      label: "Text",        icon: "T", shortcut: "T" },
  { id: "pan",       label: "Pan",         icon: "✋", shortcut: "H" },
];

export function Toolbar() {
  const activeTool = useEditorStoreV2((s) => s.activeTool);
  const setActiveTool = useEditorStoreV2((s) => s.setActiveTool);

  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        padding: "6px 10px",
        background: "#111827",
        borderBottom: "1px solid #374151",
        alignItems: "center",
        overflow: "auto",
      }}
    >
      {TOOLS.map((tool) => {
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            title={`${tool.label} (${tool.shortcut})`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 12px",
              borderRadius: 6,
              border: isActive ? "1px solid #3b82f6" : "1px solid transparent",
              background: isActive ? "rgba(59,130,246,0.2)" : "transparent",
              color: isActive ? "#60a5fa" : "#94a3b8",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "rgba(59,130,246,0.1)";
                e.currentTarget.style.color = "#e2e8f0";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#94a3b8";
              }
            }}
          >
            <span style={{ fontSize: 16 }}>{tool.icon}</span>
            <span>{tool.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default Toolbar;
