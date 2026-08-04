"use client";

import { useEffect } from "react";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";
import { Viewport3D } from "@/components/Viewport3D";
import type { CatalogItem } from "../catalogService";
import { resolveItemObjects } from "../catalogService";

interface Preview3DModalProps {
  item: CatalogItem;
  onClose: () => void;
}

/**
 * Full-screen 3D preview of a catalog design.
 *
 * Reuses the Design Studio's `Viewport3D` (which renders the editor store's
 * objects). To preview without disturbing the user's current project, the
 * previous canvas state is snapshotted on open and restored on close.
 */
export function Preview3DModal({ item, onClose }: Preview3DModalProps) {
  // Load the item's objects for preview, restore the previous canvas on exit.
  useEffect(() => {
    const previous = useEditorStoreV2.getState().objects;
    useEditorStoreV2.getState().loadObjects(resolveItemObjects(item));
    return () => useEditorStoreV2.getState().loadObjects(previous);
  }, [item]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        background: "#020617",
        display: "flex",
        flexDirection: "column",
        color: "#f8fafc",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 18px",
          borderBottom: "1px solid #1e293b",
          background: "#0f172a",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
            3D Preview
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.icon} {item.name}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Drag to orbit · scroll to zoom</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "#1e293b",
              color: "#e2e8f0",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            ✕ Close
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        <Viewport3D />
      </div>
    </div>
  );
}
