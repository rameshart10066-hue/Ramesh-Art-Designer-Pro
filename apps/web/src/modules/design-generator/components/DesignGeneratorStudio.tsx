"use client";

/**
 * Ramesh Art Designer Pro — Main Workspace
 *
 * Professional layout with:
 *   Top: MenuBar + Toolbar
 *   Left: ComponentLibrary
 *   Center: CanvasPro
 *   Right: Properties, Layers, Manufacturing (tabbed)
 *   Bottom: StatusBar
 */

import { useEffect, useState } from "react";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";
import { useAppSettingsStore } from "@/stores/appSettingsStore";
import { useProjectStore } from "@/stores/projectStore";
import { createProjectFile, startAutosave } from "@/services/projectService";
import { MenuBar } from "@/components/MenuBar";
import { StatusBar } from "@/components/StatusBar";
import ComponentLibrary from "./ComponentLibrary";
import { CanvasPro } from "./CanvasPro";
import PropertiesPanelV2 from "./PropertiesPanelV2";
import LayersPanel from "./LayersPanel";
import { Toolbar } from "./Toolbar";
import { AlignmentPanel } from "./AlignmentPanel";
import { ArrangePanel } from "./ArrangePanel";
import { TransformPanel } from "./TransformPanel";
import { ManufacturingPanel } from "./ManufacturingPanel";
import { ManufacturingWizard } from "./ManufacturingWizard";
import { AIStudioPanel } from "./AIStudioPanel";
import { VisionUploadPanel } from "@/vision/VisionUploadPanel";
import { Viewport3D } from "@/components/Viewport3D";

type RightTab = "properties" | "layers" | "manufacturing" | "ai" | "vision" | "align" | "export";

export function DesignGeneratorStudio() {
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  // Deep-links from the Welcome Dashboard / Catalog:
  //   `?tab=vision`        → photo→CAD workflow
  //   `?tab=manufacturing` → manufacturing workflow
  // Reading the URL here keeps the studio decoupled from those pages.
  // Initial-only, so the user can still switch tabs freely.
  const [rightTab, setRightTab] = useState<RightTab>(() => {
    if (typeof window === "undefined") return "properties";
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "vision") return "vision";
    if (tab === "manufacturing") return "manufacturing";
    return "properties";
  });

  // Apply persisted workspace defaults (grid size, snap) and optionally start
  // autosave when the studio mounts. Settings changes take effect on next open.
  // Also consumes the New Project Wizard's one-shot draft so the generated
  // design appears even if the in-memory editor store was reset by navigation.
  useEffect(() => {
    const settings = useAppSettingsStore.getState();
    const editor = useEditorStoreV2.getState();
    editor.setGridSize(settings.gridSize);
    editor.setShowGrid(true);
    editor.setSnapToGrid(settings.snapToGrid);

    const project = useProjectStore.getState().project;
    if (project.draftObjects && project.draftObjects.length > 0) {
      editor.loadObjects(project.draftObjects);
    }
    useProjectStore.getState().setProject({ draftObjects: null, draftName: "" });

    if (!settings.autosaveEnabled) return;
    const stopAutosave = startAutosave(
      () => createProjectFile(useEditorStoreV2.getState().objects),
      settings.autosaveIntervalMinutes * 60_000,
    );
    return () => stopAutosave();
  }, []);

  const rightPanels: Record<RightTab, { label: string; icon: string; component: React.ReactNode }> = {
    properties: {
      label: "Properties", icon: "⚙",
      component: <PropertiesPanelV2 />,
    },
    layers: {
      label: "Layers", icon: "☰",
      component: <LayersPanel />,
    },
    manufacturing: {
      label: "Manufacturing", icon: "🏭",
      component: <><ManufacturingPanel /><ManufacturingWizard /></>,
    },
    align: {
      label: "Align", icon: "⇔",
      component: (
        <div style={{ padding: 8 }}>
          <AlignmentPanel />
          <ArrangePanel />
          <TransformPanel />
        </div>
      ),
    },
    ai: {
      label: "AI Studio", icon: "🤖",
      component: <AIStudioPanel />,
    },
    vision: {
      label: "Vision", icon: "📷",
      component: <VisionUploadPanel />,
    },
    export: {
      label: "Export", icon: "⬇",
      component: (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <h4 style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>Export & Reports</h4>
          <p style={{ fontSize: 12, color: "#64748b" }}>Use File menu for export options</p>
        </div>
      ),
    },
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#020617", color: "#f8fafc" }}>
      <MenuBar />
      <Toolbar />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left Panel */}
        <div style={{ width: 280, flexShrink: 0, borderRight: "1px solid #1e293b", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #1e293b", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
            Component Library
          </div>
          <div style={{ flex: 1, overflow: "auto" }}>
            <ComponentLibrary />
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ flex: 1, position: "relative" }}>
            {/* View mode toggle */}
            <div style={{ position: "absolute", top: 8, right: 8, zIndex: 10, display: "flex", gap: 4 }}>
              <button onClick={() => setViewMode("2d")} style={{
                padding: "6px 10px", fontSize: 11, borderRadius: 6, border: "none",
                background: viewMode === "2d" ? "#3b82f6" : "#1e293b",
                color: "white", cursor: "pointer", fontWeight: 600,
              }}>2D</button>
              <button onClick={() => setViewMode("3d")} style={{
                padding: "6px 10px", fontSize: 11, borderRadius: 6, border: "none",
                background: viewMode === "3d" ? "#3b82f6" : "#1e293b",
                color: "white", cursor: "pointer", fontWeight: 600,
              }}>3D</button>
            </div>
            {viewMode === "2d" ? (
              <CanvasPro onSelect={(id) => {
                if (id) setSelectedObject(useEditorStoreV2.getState().objects.find((o) => o.id === id) || null);
                else setSelectedObject(null);
              }} />
            ) : (
              <Viewport3D onSelect={(id) => {
                if (id) setSelectedObject(useEditorStoreV2.getState().objects.find((o) => o.id === id) || null);
                else setSelectedObject(null);
              }} />
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ width: 320, flexShrink: 0, borderLeft: "1px solid #1e293b", display: "flex", flexDirection: "column", background: "#0f172a" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #1e293b" }}>
            {(Object.entries(rightPanels) as [RightTab, typeof rightPanels[RightTab]][]).map(([key, panel]) => (
              <button
                key={key}
                onClick={() => setRightTab(key)}
                style={{
                  flex: 1, padding: "10px 6px", fontSize: 11, fontWeight: 600,
                  border: "none", borderBottom: rightTab === key ? "2px solid #3b82f6" : "2px solid transparent",
                  background: "transparent", color: rightTab === key ? "#60a5fa" : "#64748b",
                  cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                {panel.icon} {panel.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflow: "auto" }}>
            {rightPanels[rightTab].component}
          </div>
        </div>
      </div>

      <StatusBar />
    </div>
  );
}
