"use client";

/**
 * Alignment & Distribution Panel
 * Align: left, right, top, bottom, center H/V
 * Distribute: horizontal, vertical
 */

import { useEditorStoreV2 } from "@/stores/editorStoreV2";

const alignTools = [
  { id: "left" as const,       label: "Align Left",      icon: "⬅" },
  { id: "centerH" as const,    label: "Center H",        icon: "↔" },
  { id: "right" as const,      label: "Align Right",     icon: "➡" },
  { id: "top" as const,        label: "Align Top",       icon: "⬆" },
  { id: "centerV" as const,    label: "Center V",        icon: "↕" },
  { id: "bottom" as const,     label: "Align Bottom",    icon: "⬇" },
];

const distributeTools = [
  { id: "distributeH" as const, label: "Distribute H",    icon: "⇔" },
  { id: "distributeV" as const, label: "Distribute V",    icon: "⇕" },
];

export function AlignmentPanel() {
  const selectedIds = useEditorStoreV2((s) => s.selectedIds);
  const alignSelectedObjects = useEditorStoreV2((s) => s.alignSelectedObjects);
  const distributeSelectedObjects = useEditorStoreV2((s) => s.distributeSelectedObjects);
  const hasSelection = selectedIds.length > 0;

  return (
    <div style={{ padding: "12px 16px" }}>
      <h4 style={{ margin: "0 0 8px 0", fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Align</h4>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
        {alignTools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => hasSelection && alignSelectedObjects(tool.id)}
            disabled={!hasSelection}
            title={tool.label}
            style={{
              padding: "6px 8px",
              fontSize: 16,
              border: "1px solid #374151",
              borderRadius: 6,
              background: "#1f2937",
              color: hasSelection ? "#e2e8f0" : "#475569",
              cursor: hasSelection ? "pointer" : "not-allowed",
              opacity: hasSelection ? 1 : 0.5,
            }}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      <h4 style={{ margin: "0 0 8px 0", fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Distribute</h4>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {distributeTools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => hasSelection && distributeSelectedObjects(tool.id === "distributeH")}
            disabled={selectedIds.length < 3}
            title={tool.label}
            style={{
              padding: "6px 8px",
              fontSize: 16,
              border: "1px solid #374151",
              borderRadius: 6,
              background: "#1f2937",
              color: selectedIds.length >= 3 ? "#e2e8f0" : "#475569",
              cursor: selectedIds.length >= 3 ? "pointer" : "not-allowed",
              opacity: selectedIds.length >= 3 ? 1 : 0.5,
            }}
          >
            {tool.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
