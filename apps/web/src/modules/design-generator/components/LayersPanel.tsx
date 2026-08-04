"use client";

import { useState, useRef } from "react";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";
import type { BaseObjectData } from "@/types/objects";

// Icon mapping for different shape types
const getIcon = (type: string) => {
  const icons: Record<string, string> = {
    rectangle: "⬛",
    circle: "⚪",
    ellipse: "🥚",
    polygon: "⬡",
    star: "⭐",
    "ganpati-frame": "🛕",
    mandap: "🏛",
    arch: "🌉",
    pillar: "🗿",
    lotus: "🪷",
    peacock: "🦚",
    text: "🔤",
    image: "🖼",
    svg: "📐",
    dome: "🕌",
    "base-platform": "🏗️",
    kalash: "🏺",
  };
  return icons[type] || "📦";
};

export default function LayersPanel() {
  const objects = useEditorStoreV2((state) => state.objects);
  const selectedIds = useEditorStoreV2((state) => state.selectedIds);
  const updateObject = useEditorStoreV2((state) => state.updateObject);
  const selectObject = useEditorStoreV2((state) => state.selectObject);
  const removeObject = useEditorStoreV2((state) => state.removeObject);
  const startBatch = useEditorStoreV2((state) => state.startBatch);
  const endBatch = useEditorStoreV2((state) => state.endBatch);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [draggedId, setDraggedId] = useState<number | null>(null);

  const dragOverIdRef = useRef<number | null>(null);

  // Sort items by zIndex (top to bottom in UI)
  const sortedItems = [...objects].sort((a, b) => b.zIndex - a.zIndex);

  // Handle layer selection
  function handleLayerClick(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    selectObject(id, e.ctrlKey || e.metaKey);
  }

  // Handle rename start
  function handleRenameStart(item: BaseObjectData, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingId(item.id);
    setEditingName(item.name);
  }

  // Handle rename complete
  function handleRenameComplete(id: number) {
    if (editingName.trim()) {
      startBatch();
      updateObject(id, { name: editingName.trim() } as any);
      endBatch("Rename layer");
    }
    setEditingId(null);
    setEditingName("");
  }

  // Handle lock toggle
  function handleLockToggle(item: BaseObjectData, e: React.MouseEvent) {
    e.stopPropagation();
    startBatch();
    updateObject(item.id, { locked: !item.locked } as any);
    endBatch("Toggle lock");
  }

  // Handle visibility toggle
  function handleVisibilityToggle(item: BaseObjectData, e: React.MouseEvent) {
    e.stopPropagation();
    startBatch();
    updateObject(item.id, { visible: !item.visible } as any);
    endBatch("Toggle visibility");
  }

  // Handle delete
  function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    removeObject(id);
  }

  // Drag and drop for reordering
  function handleDragStart(id: number, e: React.DragEvent) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(id: number, e: React.DragEvent) {
    e.preventDefault();
    dragOverIdRef.current = id;
  }

  function handleDrop(id: number, e: React.DragEvent) {
    e.preventDefault();

    if (draggedId === null || draggedId === id) {
      setDraggedId(null);
      return;
    }

    const draggedItem = objects.find((item) => item.id === draggedId);
    const targetItem = objects.find((item) => item.id === id);

    if (!draggedItem || !targetItem) return;

    startBatch();

    // Swap zIndex values
    const tempZIndex = draggedItem.zIndex;
    updateObject(draggedId, { zIndex: targetItem.zIndex } as any);
    updateObject(id, { zIndex: tempZIndex } as any);

    endBatch("Reorder layers");

    setDraggedId(null);
    dragOverIdRef.current = null;
  }

  function handleDragEnd() {
    setDraggedId(null);
    dragOverIdRef.current = null;
  }

  return (
    <div
      style={{
        width: 280,
        background: "#111827",
        color: "white",
        borderLeft: "1px solid #374151",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 20,
          borderBottom: "1px solid #374151",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>Layers</h2>
        <p
          style={{
            color: "#9CA3AF",
            fontSize: 13,
            marginTop: 5,
            marginBottom: 0,
          }}
        >
          {objects.length} {objects.length === 1 ? "object" : "objects"}
        </p>
      </div>

      {/* Layers List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {sortedItems.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "#6B7280",
              fontSize: 14,
            }}
          >
            No layers yet
            <br />
            Add objects from the library
          </div>
        ) : (
          sortedItems.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const isEditing = editingId === item.id;
            const isDragging = draggedId === item.id;

            return (
              <div
                key={item.id}
                draggable={!isEditing}
                onDragStart={(e) => handleDragStart(item.id, e)}
                onDragOver={(e) => handleDragOver(item.id, e)}
                onDrop={(e) => handleDrop(item.id, e)}
                onDragEnd={handleDragEnd}
                onClick={(e) => handleLayerClick(item.id, e)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: isSelected ? "#1e3a8a" : isDragging ? "#1f2937" : "#111827",
                  borderBottom: "1px solid #1f2937",
                  cursor: isEditing ? "text" : "pointer",
                  opacity: isDragging ? 0.5 : item.visible ? 1 : 0.4,
                  transition: "background 0.15s, opacity 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !isDragging) {
                    e.currentTarget.style.background = "#1f2937";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "#111827";
                  }
                }}
              >
                {/* Icon */}
                <span style={{ fontSize: 18, flexShrink: 0 }}>
                  {getIcon(item.type)}
                </span>

                {/* Name (editable) */}
                {isEditing ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleRenameComplete(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRenameComplete(item.id);
                      } else if (e.key === "Escape") {
                        setEditingId(null);
                        setEditingName("");
                      }
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1,
                      background: "#1f2937",
                      border: "1px solid #3b82f6",
                      borderRadius: 4,
                      padding: "4px 8px",
                      color: "white",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                ) : (
                  <span
                    onDoubleClick={(e) => handleRenameStart(item, e)}
                    style={{
                      flex: 1,
                      fontSize: 14,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.name}
                  </span>
                )}

                {/* Lock Button */}
                <button
                  onClick={(e) => handleLockToggle(item, e)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    fontSize: 16,
                    opacity: item.locked ? 1 : 0.4,
                    transition: "opacity 0.15s",
                  }}
                  title={item.locked ? "Unlock" : "Lock"}
                >
                  {item.locked ? "🔒" : "🔓"}
                </button>

                {/* Visibility Button */}
                <button
                  onClick={(e) => handleVisibilityToggle(item, e)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    fontSize: 16,
                    opacity: item.visible ? 1 : 0.4,
                    transition: "opacity 0.15s",
                  }}
                  title={item.visible ? "Hide" : "Show"}
                >
                  {item.visible ? "👁" : "👁🗨"}
                </button>

                {/* Delete Button */}
                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    fontSize: 16,
                    opacity: 0.4,
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0.4";
                    e.currentTarget.style.color = "white";
                  }}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
