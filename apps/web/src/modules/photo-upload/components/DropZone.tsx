"use client";

import { useRef, useState } from "react";

interface DropZoneProps {
  onFile: (file: File) => void;
  busy: boolean;
}

/**
 * Drag & drop + browse entry for a customer photo. Paste is handled by the
 * page (it listens on the container), but the drop zone advertises it.
 */
export function DropZone({ onFile, busy }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!busy) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragOver ? "#3b82f6" : "#334155"}`,
        borderRadius: 16,
        background: dragOver ? "rgba(59,130,246,0.08)" : "#0f172a",
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        textAlign: "center",
        cursor: busy ? "wait" : "pointer",
        transition: "border-color 0.15s ease, background 0.15s ease",
      }}
      onClick={() => {
        if (!busy) inputRef.current?.click();
      }}
    >
      <div style={{ fontSize: 48 }}>📷</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>
        Drag & drop a customer photo here
      </div>
      <div style={{ fontSize: 13, color: "#94a3b8" }}>
        or <span style={{ color: "#60a5fa", fontWeight: 600 }}>browse</span> · paste with Ctrl+V
      </div>
      <div style={{ fontSize: 11, color: "#64748b" }}>
        PNG · JPG · JPEG · WebP · HEIC · WhatsApp images
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
        style={{
          marginTop: 8,
          padding: "10px 20px",
          borderRadius: 9,
          border: "none",
          background: "#3b82f6",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Choose Image
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/heic,image/heif,.png,.jpg,.jpeg,.webp,.heic,.heif"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
    </div>
  );
}
