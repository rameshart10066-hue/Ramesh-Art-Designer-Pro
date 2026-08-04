"use client";

import React from "react";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";

/**
 * Canvas Controls Toolbar
 * 
 * Provides UI controls for:
 * - Zoom In/Out
 * - Reset Zoom
 * - Fit to Screen
 * - Center Selection
 * - Zoom slider
 */

interface CanvasControlsProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  orientation?: "horizontal" | "vertical";
  showSlider?: boolean;
}

const MIN_ZOOM = 0.1; // 10%
const MAX_ZOOM = 8.0; // 800%

export function CanvasControls({
  position = "top-right",
  orientation = "vertical",
  showSlider = true,
}: CanvasControlsProps) {
  const zoom = useEditorStoreV2((state) => state.zoom);
  const setZoom = useEditorStoreV2((state) => state.setZoom);
  const selectedIds = useEditorStoreV2((state) => state.selectedIds);
  const objects = useEditorStoreV2((state) => state.objects);

  // Access global infinite canvas API
  const infiniteCanvas = (window as any).__infiniteCanvas;

  const handleZoomIn = () => {
    if (infiniteCanvas?.zoomIn) {
      infiniteCanvas.zoomIn();
    } else {
      setZoom(Math.min(MAX_ZOOM, zoom * 1.2));
    }
  };

  const handleZoomOut = () => {
    if (infiniteCanvas?.zoomOut) {
      infiniteCanvas.zoomOut();
    } else {
      setZoom(Math.max(MIN_ZOOM, zoom * 0.8));
    }
  };

  const handleResetZoom = () => {
    if (infiniteCanvas?.resetZoom) {
      infiniteCanvas.resetZoom();
    } else {
      setZoom(1);
    }
  };

  const handleFitToScreen = () => {
    if (infiniteCanvas?.fitToScreen) {
      infiniteCanvas.fitToScreen();
    }
  };

  const handleCenterSelection = () => {
    if (infiniteCanvas?.centerSelection) {
      infiniteCanvas.centerSelection();
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setZoom(value);
  };

  // Position styles
  const positionStyles: Record<typeof position, React.CSSProperties> = {
    "top-left": { top: "80px", left: "20px" },
    "top-right": { top: "80px", right: "20px" },
    "bottom-left": { bottom: "200px", left: "20px" },
    "bottom-right": { bottom: "200px", right: "20px" },
  };

  const isVertical = orientation === "vertical";

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyles[position],
        display: "flex",
        flexDirection: isVertical ? "column" : "row",
        gap: "8px",
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid #334155",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        zIndex: 1000,
      }}
    >
      {/* Zoom In */}
      <ControlButton
        onClick={handleZoomIn}
        tooltip="Zoom In (Ctrl + Mouse Wheel)"
        disabled={zoom >= MAX_ZOOM}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
          <path d="M11 8v6" />
          <path d="M8 11h6" />
        </svg>
      </ControlButton>

      {/* Zoom Out */}
      <ControlButton
        onClick={handleZoomOut}
        tooltip="Zoom Out (Ctrl + Mouse Wheel)"
        disabled={zoom <= MIN_ZOOM}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
          <path d="M8 11h6" />
        </svg>
      </ControlButton>

      {/* Reset Zoom (100%) */}
      <ControlButton
        onClick={handleResetZoom}
        tooltip="Reset Zoom (100%)"
      >
        <span style={{ fontSize: "11px", fontWeight: "600" }}>1:1</span>
      </ControlButton>

      {/* Divider */}
      <div
        style={{
          width: isVertical ? "100%" : "1px",
          height: isVertical ? "1px" : "24px",
          backgroundColor: "#334155",
        }}
      />

      {/* Fit to Screen */}
      <ControlButton
        onClick={handleFitToScreen}
        tooltip="Fit to Screen"
        disabled={objects.length === 0}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      </ControlButton>

      {/* Center Selection */}
      <ControlButton
        onClick={handleCenterSelection}
        tooltip="Center Selection"
        disabled={selectedIds.length === 0}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
        </svg>
      </ControlButton>

      {/* Zoom Slider */}
      {showSlider && (
        <>
          <div
            style={{
              width: isVertical ? "100%" : "1px",
              height: isVertical ? "1px" : "24px",
              backgroundColor: "#334155",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: isVertical ? "column" : "row",
              alignItems: "center",
              gap: "8px",
              padding: isVertical ? "8px 0" : "0 8px",
            }}
          >
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.05}
              value={zoom}
              onChange={handleSliderChange}
              style={{
                width: isVertical ? "100%" : "120px",
                height: isVertical ? "120px" : "auto",
                cursor: "pointer",
                ...(isVertical ? { writingMode: "vertical-lr" as const, transform: "rotate(180deg)" } : {}),
              }}
            />
            <span
              style={{
                fontSize: "11px",
                color: "#94a3b8",
                fontFamily: "monospace",
                fontWeight: "500",
                minWidth: "45px",
                textAlign: "center",
              }}
            >
              {Math.round(zoom * 100)}%
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Control Button Component
 */
interface ControlButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  tooltip?: string;
  disabled?: boolean;
}

function ControlButton({ children, onClick, tooltip, disabled = false }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        backgroundColor: disabled ? "#1e293b" : "#334155",
        color: disabled ? "#475569" : "#e2e8f0",
        border: "1px solid #475569",
        borderRadius: "6px",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = "#475569";
          e.currentTarget.style.borderColor = "#64748b";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = "#334155";
          e.currentTarget.style.borderColor = "#475569";
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = "scale(0.95)";
        }
      }}
      onMouseUp={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = "scale(1)";
        }
      }}
    >
      {children}
    </button>
  );
}

export default CanvasControls;
