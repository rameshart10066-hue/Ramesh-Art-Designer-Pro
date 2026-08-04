"use client";

/**
 * Transform Panel
 * Flip horizontal/vertical, mirror, rotate
 */

import { useEditorStoreV2 } from "@/stores/editorStoreV2";

const transformTools = [
  { id: "flipH" as const, label: "Flip H", icon: "⇔", desc: "Flip Horizontal" },
  { id: "flipV" as const, label: "Flip V", icon: "⇕", desc: "Flip Vertical" },
  { id: "rotate90" as const, label: "Rot 90°", icon: "↻", desc: "Rotate 90°" },
  { id: "rotateNeg" as const, label: "Rot -90°", icon: "↺", desc: "Rotate -90°" },
];

export function TransformPanel() {
  const selectedIds = useEditorStoreV2((s) => s.selectedIds);
  const updateObject = useEditorStoreV2((s) => s.updateObject);
  const objects = useEditorStoreV2((s) => s.objects);
  const startBatch = useEditorStoreV2((s) => s.startBatch);
  const endBatch = useEditorStoreV2((s) => s.endBatch);
  const hasSelection = selectedIds.length > 0;

  function handleTransform(toolId: string) {
    if (!hasSelection) return;
    startBatch();
    for (const id of selectedIds) {
      const obj = objects.find((o) => o.id === id);
      if (!obj) continue;
      switch (toolId) {
        case "flipH":
          updateObject(id, { flipX: !obj.flipX, scaleX: -obj.scaleX } as any);
          break;
        case "flipV":
          updateObject(id, { flipY: !obj.flipY, scaleY: -obj.scaleY } as any);
          break;
        case "rotate90":
          updateObject(id, { rotation: (obj.rotation + 90) % 360 });
          break;
        case "rotateNeg":
          updateObject(id, { rotation: ((obj.rotation - 90) % 360 + 360) % 360 });
          break;
      }
    }
    endBatch("Transform");
  }

  return (
    <div style={{ padding: "12px 16px" }}>
      <h4 style={{ margin: "0 0 8px 0", fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Transform</h4>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {transformTools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleTransform(tool.id)}
            disabled={!hasSelection}
            title={tool.desc}
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
