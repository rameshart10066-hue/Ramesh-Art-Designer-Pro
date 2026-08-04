"use client";

/**
 * Template Gallery
 *
 * Full-screen modal displaying pre-built parametric design templates.
 * Users can browse by category, search, preview, and instantiate.
 */

import { useState, useMemo } from "react";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";
import { searchTemplates, getTemplatesByCategory, instantiateTemplate } from "@/services/templateEngine";
import type { DesignTemplate } from "@/services/templateEngine";
import type { BaseObjectData } from "@/types/objects";

interface TemplateGalleryProps {
  open: boolean;
  onClose: () => void;
  /**
   * Optional hook for the instantiating consumer (e.g. the New Project Wizard).
   * When provided, the instantiated objects (and the originating template) are
   * handed over instead of being added to the canvas directly, so the caller
   * controls the fresh-project flow.
   */
  onInstantiate?: (objects: BaseObjectData[], template?: DesignTemplate) => void;
}

const CATEGORIES = [
  { id: "all", label: "All Templates", icon: "📋" },
  { id: "ganpati", label: "Ganpati", icon: "👑" },
  { id: "mandap", label: "Mandap", icon: "🏛" },
  { id: "modern", label: "Modern", icon: "✨" },
  { id: "regional", label: "Regional", icon: "🎨" },
  { id: "stage", label: "Stage", icon: "🎭" },
  { id: "decorative", label: "Decorative", icon: "🪷" },
];

export function TemplateGallery({ open, onClose, onInstantiate }: TemplateGalleryProps) {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<DesignTemplate | null>(null);
  const addObject = useEditorStoreV2((s) => s.addObject);

  const templates = useMemo(() => {
    if (search.trim()) return searchTemplates(search);
    return getTemplatesByCategory(category);
  }, [category, search]);

  function handleInstantiate(template: DesignTemplate) {
    const objects = instantiateTemplate(template);
    if (onInstantiate) {
      // The caller owns the fresh-project flow (e.g. clear canvas + navigate).
      onInstantiate(objects, template);
    } else {
      for (const obj of objects) {
        addObject(obj);
      }
    }
    onClose();
  }

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(2, 6, 23, 0.95)",
      display: "flex", flexDirection: "column",
      color: "#f8fafc",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>New Design from Template</h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#94a3b8" }}>
              Start with a pre-built parametric design and customize it
            </p>
          </div>
          <button onClick={onClose} style={{
            padding: "8px 16px", borderRadius: 6, border: "1px solid #334155",
            background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 14,
          }}>
            ✕ Close
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", maxWidth: 400, padding: "10px 14px", borderRadius: 8,
            border: "1px solid #334155", background: "#1e293b", color: "white",
            fontSize: 14, outline: "none", boxSizing: "border-box",
          }}
          onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
          onBlur={(e) => e.target.style.borderColor = "#334155"}
        />
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 4, padding: "12px 24px", borderBottom: "1px solid #1e293b", overflow: "auto" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            style={{
              padding: "8px 14px", borderRadius: 6, border: "none",
              background: category === cat.id ? "#1e3a8a" : "#1e293b",
              color: category === cat.id ? "#60a5fa" : "#94a3b8",
              cursor: "pointer", fontSize: 13, fontWeight: category === cat.id ? 600 : 400,
              whiteSpace: "nowrap",
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {templates.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
            No templates found matching your search
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                style={{
                  background: "#1e293b", borderRadius: 12, overflow: "hidden",
                  border: selectedTemplate?.id === template.id ? "2px solid #3b82f6" : "2px solid transparent",
                  cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
              >
                {/* Preview area */}
                <div style={{
                  height: 160, background: "#0f172a",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 48, borderBottom: "1px solid #334155",
                }}>
                  {template.icon}
                </div>

                {/* Info */}
                <div style={{ padding: "14px 16px" }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{template.name}</h3>
                  <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.4, marginBottom: 8 }}>
                    {template.description}
                  </p>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 11, color: "#64748b" }}>
                    <span>⏱ {template.estimatedTime}</span>
                    <span>•</span>
                    <span>📊 {template.difficulty}</span>
                    <span>•</span>
                    <span>{'★'.repeat(template.complexity)}{'☆'.repeat(5 - template.complexity)}</span>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleInstantiate(template); }}
                      style={{
                        flex: 1, padding: "8px 12px", borderRadius: 6, border: "none",
                        background: "#3b82f6", color: "white", fontSize: 12, fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
