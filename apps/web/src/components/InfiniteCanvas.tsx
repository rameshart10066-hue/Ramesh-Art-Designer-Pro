"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";

/**
 * Infinite Canvas Component
 * 
 * Features:
 * - Pan with Middle Mouse Button
 * - Pan with Space + Drag
 * - Smooth Zoom with Ctrl + Mouse Wheel
 * - Zoom limits: 10% - 800%
 * - Fit to Screen
 * - Center Selection
 * - Mini Viewport Navigator
 * - Performance Optimized
 */

interface InfiniteCanvasProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  showMinimap?: boolean;
  minimapPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  onPanChange?: (x: number, y: number) => void;
  onZoomChange?: (zoom: number) => void;
}

const MIN_ZOOM = 0.1; // 10%
const MAX_ZOOM = 8.0; // 800%
const ZOOM_STEP = 0.1;
const ZOOM_SMOOTHING = 0.05;

export function InfiniteCanvas({
  children,
  width = 3000,
  height = 3000,
  showMinimap = true,
  minimapPosition = "bottom-right",
  onPanChange,
  onZoomChange,
}: InfiniteCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // Store state
  const zoom = useEditorStoreV2((state) => state.zoom);
  const panX = useEditorStoreV2((state) => state.panX);
  const panY = useEditorStoreV2((state) => state.panY);
  const setZoom = useEditorStoreV2((state) => state.setZoom);
  const setPan = useEditorStoreV2((state) => state.setPan);
  const objects = useEditorStoreV2((state) => state.objects);
  const selectedIds = useEditorStoreV2((state) => state.selectedIds);

  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [initialPan, setInitialPan] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  // Target zoom for smooth zooming
  const targetZoomRef = useRef(zoom);
  const animationFrameRef = useRef<number | null>(null);

  // Update container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Smooth zoom animation
  useEffect(() => {
    const animate = () => {
      const currentZoom = useEditorStoreV2.getState().zoom;
      const diff = targetZoomRef.current - currentZoom;

      if (Math.abs(diff) > 0.001) {
        const newZoom = currentZoom + diff * ZOOM_SMOOTHING;
        const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
        setZoom(clampedZoom);
        onZoomChange?.(clampedZoom);
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setZoom(targetZoomRef.current);
        onZoomChange?.(targetZoomRef.current);
        animationFrameRef.current = null;
      }
    };

    if (animationFrameRef.current === null && Math.abs(targetZoomRef.current - zoom) > 0.001) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [zoom, setZoom, onZoomChange]);

  // Handle zoom with mouse wheel (Ctrl + Wheel)
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;

      e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate zoom
      const delta = -e.deltaY;
      const zoomFactor = delta > 0 ? 1 + ZOOM_STEP : 1 - ZOOM_STEP;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * zoomFactor));

      // Zoom toward mouse position
      const scale = newZoom / zoom;
      const newPanX = mouseX - (mouseX - panX) * scale;
      const newPanY = mouseY - (mouseY - panY) * scale;

      targetZoomRef.current = newZoom;
      setPan(newPanX, newPanY);
      onPanChange?.(newPanX, newPanY);
    },
    [zoom, panX, panY, setPan, onPanChange]
  );

  // Attach wheel listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Handle mouse down for panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle mouse button or Space + Left mouse button
      if (e.button === 1 || (e.button === 0 && spacePressed)) {
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        setInitialPan({ x: panX, y: panY });
      }
    },
    [spacePressed, panX, panY]
  );

  // Handle mouse move for panning
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;

      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;

      const newPanX = initialPan.x + dx;
      const newPanY = initialPan.y + dy;

      setPan(newPanX, newPanY);
      onPanChange?.(newPanX, newPanY);
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    if (isPanning) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isPanning, panStart, initialPan, setPan, onPanChange]);

  // Handle space key for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Fit to screen
  const fitToScreen = useCallback(() => {
    if (objects.length === 0 || !containerRef.current) return;

    // Calculate bounds of all objects
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    objects.forEach((obj) => {
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + obj.width);
      maxY = Math.max(maxY, obj.y + obj.height);
    });

    const boundsWidth = maxX - minX;
    const boundsHeight = maxY - minY;
    const boundsCenterX = (minX + maxX) / 2;
    const boundsCenterY = (minY + maxY) / 2;

    // Calculate zoom to fit
    const padding = 50;
    const zoomX = (containerSize.width - padding * 2) / boundsWidth;
    const zoomY = (containerSize.height - padding * 2) / boundsHeight;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(zoomX, zoomY)));

    // Center the bounds
    const newPanX = containerSize.width / 2 - boundsCenterX * newZoom;
    const newPanY = containerSize.height / 2 - boundsCenterY * newZoom;

    targetZoomRef.current = newZoom;
    setPan(newPanX, newPanY);
    onPanChange?.(newPanX, newPanY);
  }, [objects, containerSize, setPan, onPanChange]);

  // Center selection
  const centerSelection = useCallback(() => {
    if (selectedIds.length === 0 || !containerRef.current) return;

    const selectedObjects = objects.filter((obj) => selectedIds.includes(obj.id));
    if (selectedObjects.length === 0) return;

    // Calculate bounds of selected objects
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedObjects.forEach((obj) => {
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + obj.width);
      maxY = Math.max(maxY, obj.y + obj.height);
    });

    const boundsCenterX = (minX + maxX) / 2;
    const boundsCenterY = (minY + maxY) / 2;

    // Center the selection
    const newPanX = containerSize.width / 2 - boundsCenterX * zoom;
    const newPanY = containerSize.height / 2 - boundsCenterY * zoom;

    setPan(newPanX, newPanY);
    onPanChange?.(newPanX, newPanY);
  }, [selectedIds, objects, zoom, containerSize, setPan, onPanChange]);

  // Expose functions via ref (can be used by parent components)
  useEffect(() => {
    (window as any).__infiniteCanvas = {
      fitToScreen,
      centerSelection,
      zoomIn: () => {
        targetZoomRef.current = Math.min(MAX_ZOOM, zoom * (1 + ZOOM_STEP * 2));
      },
      zoomOut: () => {
        targetZoomRef.current = Math.max(MIN_ZOOM, zoom * (1 - ZOOM_STEP * 2));
      },
      resetZoom: () => {
        targetZoomRef.current = 1;
      },
      getZoom: () => zoom,
      getPan: () => ({ x: panX, y: panY }),
    };
  }, [fitToScreen, centerSelection, zoom, panX, panY]);

  // Cursor style
  const cursorStyle = isPanning || (spacePressed && !isPanning) ? "grab" : "default";

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        cursor: isPanning ? "grabbing" : cursorStyle,
        touchAction: "none",
      }}
    >
      {/* Canvas content */}
      <div
        ref={canvasRef}
        style={{
          position: "absolute",
          transformOrigin: "0 0",
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          width: `${width}px`,
          height: `${height}px`,
          willChange: isPanning ? "transform" : "auto",
        }}
      >
        {children}
      </div>

      {/* Mini Viewport Navigator */}
      {showMinimap && (
        <Minimap
          canvasWidth={width}
          canvasHeight={height}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
          zoom={zoom}
          panX={panX}
          panY={panY}
          objects={objects}
          position={minimapPosition}
          onNavigate={(x, y) => {
            setPan(x, y);
            onPanChange?.(x, y);
          }}
        />
      )}

      {/* Zoom indicator */}
      <div
        style={{
          position: "absolute",
          bottom: showMinimap && (minimapPosition.includes("bottom")) ? "170px" : "20px",
          left: minimapPosition.includes("left") ? "170px" : "20px",
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          color: "#e2e8f0",
          padding: "8px 12px",
          borderRadius: "6px",
          fontSize: "12px",
          fontFamily: "monospace",
          fontWeight: "500",
          border: "1px solid #334155",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}

/**
 * Mini Viewport Navigator Component
 */
interface MinimapProps {
  canvasWidth: number;
  canvasHeight: number;
  containerWidth: number;
  containerHeight: number;
  zoom: number;
  panX: number;
  panY: number;
  objects: any[];
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  onNavigate: (x: number, y: number) => void;
}

function Minimap({
  canvasWidth,
  canvasHeight,
  containerWidth,
  containerHeight,
  zoom,
  panX,
  panY,
  objects,
  position,
  onNavigate,
}: MinimapProps) {
  const minimapRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const minimapSize = 150;
  const scale = minimapSize / Math.max(canvasWidth, canvasHeight);

  // Calculate viewport rectangle in minimap coordinates
  const viewportX = -panX / zoom * scale;
  const viewportY = -panY / zoom * scale;
  const viewportWidth = containerWidth / zoom * scale;
  const viewportHeight = containerHeight / zoom * scale;

  // Handle minimap click/drag
  const handleMinimapInteraction = useCallback(
    (e: React.MouseEvent) => {
      const rect = minimapRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Convert minimap coordinates to canvas pan
      const canvasX = -(x / scale - containerWidth / zoom / 2);
      const canvasY = -(y / scale - containerHeight / zoom / 2);

      onNavigate(canvasX * zoom, canvasY * zoom);
    },
    [scale, zoom, containerWidth, containerHeight, onNavigate]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleMinimapInteraction(e);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const rect = minimapRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const canvasX = -(x / scale - containerWidth / zoom / 2);
      const canvasY = -(y / scale - containerHeight / zoom / 2);

      onNavigate(canvasX * zoom, canvasY * zoom);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, scale, zoom, containerWidth, containerHeight, onNavigate]);

  // Position styles
  const positionStyles: Record<typeof position, React.CSSProperties> = {
    "top-left": { top: "20px", left: "20px" },
    "top-right": { top: "20px", right: "20px" },
    "bottom-left": { bottom: "20px", left: "20px" },
    "bottom-right": { bottom: "20px", right: "20px" },
  };

  return (
    <div
      ref={minimapRef}
      onMouseDown={handleMouseDown}
      style={{
        position: "absolute",
        ...positionStyles[position],
        width: `${minimapSize}px`,
        height: `${minimapSize}px`,
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        border: "2px solid #334155",
        borderRadius: "8px",
        cursor: isDragging ? "grabbing" : "pointer",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Canvas background */}
      <div
        style={{
          position: "absolute",
          width: `${canvasWidth * scale}px`,
          height: `${canvasHeight * scale}px`,
          backgroundColor: "#1e293b",
          border: "1px solid #475569",
        }}
      />

      {/* Objects */}
      {objects.map((obj) => (
        <div
          key={obj.id}
          style={{
            position: "absolute",
            left: `${obj.x * scale}px`,
            top: `${obj.y * scale}px`,
            width: `${obj.width * scale}px`,
            height: `${obj.height * scale}px`,
            backgroundColor: obj.fill || "#64748b",
            opacity: 0.7,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Viewport indicator */}
      <div
        style={{
          position: "absolute",
          left: `${viewportX}px`,
          top: `${viewportY}px`,
          width: `${viewportWidth}px`,
          height: `${viewportHeight}px`,
          border: "2px solid #3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export default InfiniteCanvas;
