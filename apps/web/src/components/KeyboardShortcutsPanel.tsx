"use client";

import { useState } from "react";

/**
 * Keyboard Shortcuts Help Panel
 * Displays all available shortcuts in a modal
 */

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string; description: string }[];
}

const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const modKey = isMac ? "⌘" : "Ctrl";

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Editing",
    shortcuts: [
      { keys: `${modKey}+Z`, description: "Undo" },
      { keys: `${modKey}+Shift+Z`, description: "Redo" },
      { keys: `${modKey}+C`, description: "Copy" },
      { keys: `${modKey}+X`, description: "Cut" },
      { keys: `${modKey}+V`, description: "Paste" },
      { keys: `${modKey}+D`, description: "Duplicate" },
      { keys: "Delete / Backspace", description: "Delete selected" },
    ],
  },
  {
    title: "Selection",
    shortcuts: [
      { keys: `${modKey}+A`, description: "Select all" },
      { keys: "Esc", description: "Clear selection" },
    ],
  },
  {
    title: "Movement",
    shortcuts: [
      { keys: "Arrow Keys", description: "Move 1px" },
      { keys: "Shift+Arrow", description: "Move 10px" },
    ],
  },
  {
    title: "Canvas",
    shortcuts: [
      { keys: "Space+Drag", description: "Pan canvas" },
      { keys: `${modKey}+Wheel`, description: "Zoom in/out" },
    ],
  },
];

export function KeyboardShortcutsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "#3b82f6",
          color: "#fff",
          border: "none",
          fontSize: 18,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
          zIndex: 1000,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
        title="Keyboard Shortcuts"
      >
        ?
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              background: "#1e293b",
              borderRadius: 16,
              padding: 32,
              maxWidth: 600,
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#f8fafc",
                }}
              >
                Keyboard Shortcuts
              </h2>
              <p
                style={{
                  margin: "8px 0 0 0",
                  fontSize: 14,
                  color: "#94a3b8",
                }}
              >
                Speed up your workflow with these shortcuts
              </p>
            </div>

            {/* Shortcut Groups */}
            <div style={{ display: "grid", gap: 24 }}>
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.title}>
                  <h3
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#3b82f6",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {group.title}
                  </h3>
                  <div style={{ display: "grid", gap: 8 }}>
                    {group.shortcuts.map((shortcut, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 12px",
                          background: "rgba(15, 23, 42, 0.6)",
                          borderRadius: 8,
                        }}
                      >
                        <span style={{ color: "#cbd5e1", fontSize: 14 }}>
                          {shortcut.description}
                        </span>
                        <kbd
                          style={{
                            padding: "4px 8px",
                            background: "#334155",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#f8fafc",
                            fontFamily: "monospace",
                            border: "1px solid #475569",
                          }}
                        >
                          {shortcut.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              style={{
                marginTop: 24,
                width: "100%",
                padding: "12px 24px",
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#2563eb";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#3b82f6";
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
