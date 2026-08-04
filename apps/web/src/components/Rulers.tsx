"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";

/**
 * Professional Rulers Component
 * Figma/Photoshop-style rulers with draggable guides
 */

interface RulersProps {
  canvasWidth: number;
  canvasHeight: number;
  containerWidth: number;
  containerHeight: number;
}

const RULER_SIZE = 20; // pixels
const TICK_MAJOR = 100; // Major tick every 100px
const TICK_MINOR = 50; // Minor tick every 50px
const TICK_SMALL = 10; // Small tick every 10px

export function Rulers({
  canvasWidth,
  canvasHeight,
  containerWidth,
  containerHeight,
}: RulersProps) {
  const zoom = useEditorStoreV2((state) => state.zoom);
  const panX = useEditorStoreV2((state) => state.panX);
  const panY = useEditorStoreV2((state) => state.panY);
  const horizontalGuides = useEditorStoreV2((state) => state.horizontalGuides);
  const verticalGuides = useEditorStoreV2((state) => state.verticalGuides);
  const addHorizontalGuide = useEditorStoreV2((state) => state.addHorizontalGuide);
  const addVerticalGuide = useEditorStoreV2((state) => state.addVerticalGuide);
  const removeHorizontalGuide = useEditorStoreV2((state) => state.removeHorizontalGuide);
  const removeVerticalGuide = useEditorStoreV2((state) => state.removeVerticalGuide);

  const [cursorX, setCursorX] = useState<number | null>(null);
  const [cursorY, setCursorY] = useState<number | null>(null);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const [draggedGuideIndex, setDraggedGuideIndex] = useState<number | null>(null);

  const horizontalRulerRef = useRef<HTMLCanvasElement>(null);
  const verticalRulerRef = useRef<HTMLCanvasElement>(null);

  // Draw horizontal ruler
  const drawHorizontalRuler = useCallback(() => {
    const canvas = horizontalRulerRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = RULER_SIZE * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${RULER_SIZE}px`;

    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, containerWidth, RULER_SIZE);

    // Calculate visible range
    const startX = -panX / zoom;
    const endX = (containerWidth - panX) / zoom;

    ctx.fillStyle = "#94a3b8";
    ctx.strokeStyle = "#64748b";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    // Draw ticks
    for (let x = Math.floor(startX / TICK_SMALL) * TICK_SMALL; x <= endX; x += TICK_SMALL) {
      const screenX = x * zoom + panX;

      if (screenX < 0 || screenX > containerWidth) continue;

      const isMajor = x % TICK_MAJOR === 0;
      const isMinor = x % TICK_MINOR === 0;

      if (isMajor) {
        // Major tick
        ctx.beginPath();
        ctx.moveTo(screenX, RULER_SIZE);
        ctx.lineTo(screenX, RULER_SIZE - 10);
        ctx.stroke();
        ctx.fillText(String(x), screenX, 2);
      } else if (isMinor) {
        // Minor tick
        ctx.beginPath();
        ctx.moveTo(screenX, RULER_SIZE);
        ctx.lineTo(screenX, RULER_SIZE - 7);
        ctx.stroke();
      } else {
        // Small tick
        ctx.beginPath();
        ctx.moveTo(screenX, RULER_SIZE);
        ctx.lineTo(screenX, RULER_SIZE - 4);
        ctx.stroke();
      }
    }

    // Draw cursor position indicator
    if (cursorX !== null) {
      const screenX = cursorX * zoom + panX;
      if (screenX >= 0 && screenX <= containerWidth) {
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(screenX - 1, 0, 2, RULER_SIZE);
        
        // Draw value
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(screenX - 20, 0, 40, 12);
        ctx.fillStyle = "#1e293b";
        ctx.fillText(String(Math.round(cursorX)), screenX, 2);
      }
    }
  }, [containerWidth, zoom, panX, cursorX]);

  // Draw vertical ruler
  const drawVerticalRuler = useCallback(() => {
    const canvas = verticalRulerRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = RULER_SIZE * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = `${RULER_SIZE}px`;
    canvas.style.height = `${containerHeight}px`;

    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, RULER_SIZE, containerHeight);

    // Calculate visible range
    const startY = -panY / zoom;
    const endY = (containerHeight - panY) / zoom;

    ctx.fillStyle = "#94a3b8";
    ctx.strokeStyle = "#64748b";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw ticks
    for (let y = Math.floor(startY / TICK_SMALL) * TICK_SMALL; y <= endY; y += TICK_SMALL) {
      const screenY = y * zoom + panY;

      if (screenY < 0 || screenY > containerHeight) continue;

      const isMajor = y % TICK_MAJOR === 0;
      const isMinor = y % TICK_MINOR === 0;

      if (isMajor) {
        // Major tick
        ctx.beginPath();
        ctx.moveTo(RULER_SIZE, screenY);
        ctx.lineTo(RULER_SIZE - 10, screenY);
        ctx.stroke();
        
        // Rotate text
        ctx.save();
        ctx.translate(8, screenY);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(String(y), 0, 0);
        ctx.restore();
      } else if (isMinor) {
        // Minor tick
        ctx.beginPath();
        ctx.moveTo(RULER_SIZE, screenY);
        ctx.lineTo(RULER_SIZE - 7, screenY);
        ctx.stroke();
      } else {
        // Small tick
        ctx.beginPath();
        ctx.moveTo(RULER_SIZE, screenY);
        ctx.lineTo(RULER_SIZE - 4, screenY);
        ctx.stroke();
      }
    }

    // Draw cursor position indicator
    if (cursorY !== null) {
      const screenY = cursorY * zoom + panY;
      if (screenY >= 0 && screenY <= containerHeight) {
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(0, screenY - 1, RULER_SIZE, 2);
        
        // Draw value
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, screenY - 6, RULER_SIZE, 12);
        ctx.fillStyle = "#1e293b";
        ctx.save();
        ctx.translate(10, screenY);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(String(Math.round(cursorY)), 0, 0);
        ctx.restore();
      }
    }
  }, [containerHeight, zoom, panY, cursorY]);

  // Redraw on changes
  useEffect(() => {
    drawHorizontalRuler();
    drawVerticalRuler();
  }, [drawHorizontalRuler, drawVerticalRuler]);

  // Handle mouse move for cursor position
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const canvasX = (e.clientX - panX) / zoom;
      const canvasY = (e.clientY - RULER_SIZE - panY) / zoom;
      
      setCursorX(canvasX);
      setCursorY(canvasY);
      
      drawHorizontalRuler();
      drawVerticalRuler();
    },
    [panX, panY, zoom, drawHorizontalRuler, drawVerticalRuler]
  );

  const handleMouseLeave = useCallback(() => {
    setCursorX(null);
    setCursorY(null);
    drawHorizontalRuler();
    drawVerticalRuler();
  }, [drawHorizontalRuler, drawVerticalRuler]);

  // Horizontal ruler drag to create guide
  const handleHorizontalRulerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDraggingHorizontal(true);
      const canvasY = (e.clientY - RULER_SIZE - panY) / zoom;
      addHorizontalGuide(canvasY);
      setDraggedGuideIndex(horizontalGuides.length);
    },
    [panY, zoom, addHorizontalGuide, horizontalGuides.length]
  );

  // Vertical ruler drag to create guide
  const handleVerticalRulerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDraggingVertical(true);
      const canvasX = (e.clientX - RULER_SIZE - panX) / zoom;
      addVerticalGuide(canvasX);
      setDraggedGuideIndex(verticalGuides.length);
    },
    [panX, zoom, addVerticalGuide, verticalGuides.length]
  );

  // Global mouse move for dragging guides
  useEffect(() => {
    function handleGlobalMouseMove(e: MouseEvent) {
      if (isDraggingHorizontal && draggedGuideIndex !== null) {
        const canvasY = (e.clientY - RULER_SIZE - panY) / zoom;
        const oldGuide = horizontalGuides[draggedGuideIndex];
        if (oldGuide !== undefined) {
          removeHorizontalGuide(oldGuide);
          addHorizontalGuide(canvasY);
        }
      } else if (isDraggingVertical && draggedGuideIndex !== null) {
        const canvasX = (e.clientX - RULER_SIZE - panX) / zoom;
        const oldGuide = verticalGuides[draggedGuideIndex];
        if (oldGuide !== undefined) {
          removeVerticalGuide(oldGuide);
          addVerticalGuide(canvasX);
        }
      }
    }

    function handleGlobalMouseUp(e: MouseEvent) {
      // Remove guide if dragged outside canvas
      if (isDraggingHorizontal && draggedGuideIndex !== null) {
        const isOutside = e.clientX < RULER_SIZE || e.clientX > containerWidth;
        if (isOutside) {
          const guide = horizontalGuides[draggedGuideIndex];
          if (guide !== undefined) {
            removeHorizontalGuide(guide);
          }
        }
      } else if (isDraggingVertical && draggedGuideIndex !== null) {
        const isOutside = e.clientY < RULER_SIZE || e.clientY > containerHeight;
        if (isOutside) {
          const guide = verticalGuides[draggedGuideIndex];
          if (guide !== undefined) {
            removeVerticalGuide(guide);
          }
        }
      }

      setIsDraggingHorizontal(false);
      setIsDraggingVertical(false);
      setDraggedGuideIndex(null);
    }

    if (isDraggingHorizontal || isDraggingVertical) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [
    isDraggingHorizontal,
    isDraggingVertical,
    draggedGuideIndex,
    panX,
    panY,
    zoom,
    horizontalGuides,
    verticalGuides,
    removeHorizontalGuide,
    removeVerticalGuide,
    addHorizontalGuide,
    addVerticalGuide,
    containerWidth,
    containerHeight,
  ]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <>
      {/* Corner square */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: RULER_SIZE,
          height: RULER_SIZE,
          background: "#0f172a",
          zIndex: 1002,
          borderRight: "1px solid #334155",
          borderBottom: "1px solid #334155",
        }}
      />

      {/* Horizontal ruler */}
      <canvas
        ref={horizontalRulerRef}
        onMouseDown={handleHorizontalRulerMouseDown}
        onMouseLeave={handleMouseLeave}
        style={{
          position: "absolute",
          top: 0,
          left: RULER_SIZE,
          cursor: "ns-resize",
          zIndex: 1001,
          borderBottom: "1px solid #334155",
        }}
      />

      {/* Vertical ruler */}
      <canvas
        ref={verticalRulerRef}
        onMouseDown={handleVerticalRulerMouseDown}
        onMouseLeave={handleMouseLeave}
        style={{
          position: "absolute",
          top: RULER_SIZE,
          left: 0,
          cursor: "ew-resize",
          zIndex: 1001,
          borderRight: "1px solid #334155",
        }}
      />

      {/* Render guide lines */}
      {horizontalGuides.map((guide, index) => {
        const screenY = guide * zoom + panY;
        return (
          <div
            key={`h-guide-${index}`}
            style={{
              position: "absolute",
              top: screenY + RULER_SIZE,
              left: RULER_SIZE,
              width: containerWidth - RULER_SIZE,
              height: 1,
              background: "#06b6d4",
              pointerEvents: "auto",
              cursor: "ns-resize",
              zIndex: 999,
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDraggingHorizontal(true);
              setDraggedGuideIndex(index);
            }}
          />
        );
      })}

      {verticalGuides.map((guide, index) => {
        const screenX = guide * zoom + panX;
        return (
          <div
            key={`v-guide-${index}`}
            style={{
              position: "absolute",
              top: RULER_SIZE,
              left: screenX + RULER_SIZE,
              width: 1,
              height: containerHeight - RULER_SIZE,
              background: "#06b6d4",
              pointerEvents: "auto",
              cursor: "ew-resize",
              zIndex: 999,
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDraggingVertical(true);
              setDraggedGuideIndex(index);
            }}
          />
        );
      })}
    </>
  );
}
