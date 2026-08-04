"use client";

/**
 * Arrange Panel
 * Bring forward/send backward, bring to front/send to back
 */

import { useEditorStoreV2 } from "@/stores/editorStoreV2";

const tools = [
  { id: "bringToFront" as const,  label: "Bring to Front",  icon: "⏫" },
  { id: "bringForward" as const,  label: "Bring Forward",   icon: "⬆" },
  { id: "sendBackward" as const,  label: "Send Backward",   icon: "⬇" },
  { id: "sendToBack" as const,    label: "Send to Back",    icon: "⏬" },
];

export function ArrangePanel() {
  const selectedIds = useEditorStoreV2((s) => s.selectedIds);
  const bringForward = useEditorStoreV2((s) => s.bringForward);
  const sendBackward = useEditorStoreV2((s) => s.sendBackward);
  const bringToFront = useEditorStoreV2((s) => s.bringToFront);
  const sendToBack = useEditorStoreV2((s) => s.sendToBack);
  const hasSelection = selectedIds.length > 0;

  const actions = { bringForward, sendBackward, bringToFront, sendToBack };

  return (
    <div style={{ padding: "12px 16px" }}>
      <h4 style={{ margin: "0 0 8px 0", fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Arrange</h4>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => { if (hasSelection) actions[tool.id](selectedIds[0]!); }}
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
    </div>
  );
}
