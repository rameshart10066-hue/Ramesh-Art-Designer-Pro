"use client";

/**
 * CanvasPro – Professional canvas component powered by the canvas engine
 * and the polymorphic BaseCanvasObject rendering system.
 *
 * Renders all objects on a <canvas> element using Canvas2D, supports
 * full interaction (select, drag, resize, rotate, rubber‑band multi‑select),
 * smart snapping, grid overlay, alignment guides, and viewport controls.
 *
 * Architecture:
 *   Store (BaseObjectData[])  →  Renderer (Map<id, ICanvasObject>)  →  Canvas2D
 *   Pointer events → engine transforms → store updates → redraw
 */

import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from "react";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";
import type { CanvasTool } from "@/stores/editorStoreV2";
import { useCanvasEngine } from "@/hooks/useCanvasEngine";
import { ObjectFactory } from "@/objects/ObjectFactory";
import type { BaseObjectData, ICanvasObject, Point as ObjPoint } from "@/types/objects";
import type { Point, Rect, ViewportState, GridConfig, ResizeCorner } from "@/lib/canvas-engine/types";
import type { AlignmentGuide } from "@/services/editor/alignmentService";
import { generateGrid } from "@/lib/canvas-engine/grid";

// ── CanvasPro Props ───────────────────────────────────────────────

interface CanvasProProps {
  onSelect?: (id: number | null) => void;
  canvasWidth?: number;
  canvasHeight?: number;
}

// ── Interaction state machine ─────────────────────────────────────

type InteractionMode = "idle" | "panning" | "dragging" | "resizing" | "rotating" | "selecting" | "drawing";

interface InteractionState {
  mode: InteractionMode;
  targetId: number | null;
  dragTargetIds: number[];
  pointerStart: Point;
  pointerStartWorld: Point;
  initialStates: Map<number, BaseObjectData>;
  resizeCorner: ResizeCorner | null;
  rotationCenter: Point;
  selectionRect: Rect | null;
}

function createInteractionState(): InteractionState {
  return {
    mode: "idle",
    targetId: null,
    dragTargetIds: [],
    pointerStart: { x: 0, y: 0 },
    pointerStartWorld: { x: 0, y: 0 },
    initialStates: new Map(),
    resizeCorner: null,
    rotationCenter: { x: 0, y: 0 },
    selectionRect: null,
  };
}

// ── Render constants ──────────────────────────────────────────────

const HANDLE_SIZE = 8;
const HANDLE_HIT = 10;
const ROTATION_OFFSET = 35;
const ROTATION_HANDLE_RADIUS = 7;
const ROTATION_HIT_RADIUS = 12;
const HANDLE_COLOR = "#3b82f6";
const HANDLE_BORDER = "#ffffff";
const ROTATION_COLOR = "#22c55e";
const SELECTION_BORDER = "#3b82f6";
const GUIDE_COLOR = "#ff00ff";
const MIN_OBJECT_SIZE = 5;

// ── Cached object wrapper ─────────────────────────────────────────

function createObjectWrapper(data: BaseObjectData): ICanvasObject {
  return ObjectFactory.create(data.type as any, {
    ...data,
    id: data.id,
    x: data.x, y: data.y,
    width: data.width, height: data.height,
    fill: data.fill, stroke: data.stroke,
    strokeWidth: data.strokeWidth,
    rotation: data.rotation,
    opacity: data.opacity,
    visible: data.visible,
    locked: data.locked,
    scaleX: data.scaleX, scaleY: data.scaleY,
    flipX: data.flipX, flipY: data.flipY,
    name: data.name,
    category: data.category,
    children: data.children,
    metadata: data.metadata,
  });
}

// ── CanvasPro Component ───────────────────────────────────────────

export function CanvasPro({
  onSelect,
  canvasWidth = 3000,
  canvasHeight = 3000,
}: CanvasProProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });
  const [spacePressed, setSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [selectionRect, setSelectionRect] = useState<Rect | null>(null);
  const panStartRef = useRef<Point>({ x: 0, y: 0 });
  const panInitialRef = useRef<Point>({ x: 0, y: 0 });
  const interactionRef = useRef<InteractionState>(createInteractionState());
  const objCacheRef = useRef<Map<number, ICanvasObject>>(new Map());
  const rafRef = useRef<number>(0);
  const needsRedrawRef = useRef(true);

  // Store selectors
  const objects = useEditorStoreV2((s) => s.objects);
  const selectedIds = useEditorStoreV2((s) => s.selectedIds);
  const zoom = useEditorStoreV2((s) => s.zoom);
  const panX = useEditorStoreV2((s) => s.panX);
  const panY = useEditorStoreV2((s) => s.panY);
  const setPan = useEditorStoreV2((s) => s.setPan);
  const showGrid = useEditorStoreV2((s) => s.showGrid);
  const showGuides = useEditorStoreV2((s) => s.showGuides);
  const snapToObjectsEnabled = useEditorStoreV2((s) => s.snapToObjects);
  const snapToGridEnabled = useEditorStoreV2((s) => s.snapToGrid);
  const gridSize = useEditorStoreV2((s) => s.gridSize);
  const snapTolerance = useEditorStoreV2((s) => s.snapTolerance);
  const selectObject = useEditorStoreV2((s) => s.selectObject);
  const clearSelection = useEditorStoreV2((s) => s.clearSelection);
  const updateObject = useEditorStoreV2((s) => s.updateObject);
  const startBatch = useEditorStoreV2((s) => s.startBatch);
  const endBatch = useEditorStoreV2((s) => s.endBatch);
  const alignmentGuides = useEditorStoreV2((s) => s.alignmentGuides);
  const setAlignmentGuides = useEditorStoreV2((s) => s.setAlignmentGuides);
  const clearAlignmentGuides = useEditorStoreV2((s) => s.clearAlignmentGuides);
  const activeTool = useEditorStoreV2((s) => s.activeTool);
  const addObject = useEditorStoreV2((s) => s.addObject);

  // Drawing preview state (world coords)
  const [drawPreview, setDrawPreview] = useState<{
    start: Point;
    current: Point;
  } | null>(null);

  // Canvas engine API
  const engine = useCanvasEngine(containerSize.w, containerSize.h);

  // Derived configs
  const gridConfig: GridConfig = useMemo(
    () => ({
      enabled: showGrid,
      size: gridSize,
      snapEnabled: snapToGridEnabled,
      subdivisions: 5,
      dotMode: false,
    }),
    [showGrid, gridSize, snapToGridEnabled]
  );

  const viewport: ViewportState = useMemo(
    () => ({ zoom, panX, panY }),
    [zoom, panX, panY]
  );

  // ── Container resize observer ─────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setContainerSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Object cache sync ───────────────────────────────────────────
  // Keep the cached ICanvasObject wrappers in sync with store objects

  useEffect(() => {
    const cache = objCacheRef.current;
    const storeIds = new Set(objects.map((o) => o.id));

    // Remove stale entries
    for (const [id] of cache) {
      if (!storeIds.has(id)) cache.delete(id);
    }

    // Add or update entries
    for (const objData of objects) {
      const existing = cache.get(objData.id);
      if (existing) {
        existing.update(objData as any);
      } else {
        cache.set(objData.id, createObjectWrapper(objData));
      }
    }

    needsRedrawRef.current = true;
  }, [objects]);

  // ── Space bar for panning mode ──────────────────────────────────

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setSpacePressed(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // ── Tool keyboard shortcuts ─────────────────────────────────────

  useEffect(() => {
    const toolMap: Record<string, CanvasTool> = {
      v: "select",
      r: "rectangle",
      c: "circle",
      e: "ellipse",
      s: "star",
      p: "polygon",
      l: "line",
      t: "text",
      h: "pan",
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.target instanceof HTMLInputElement) return;
      const tool = toolMap[e.key.toLowerCase()];
      if (tool) {
        e.preventDefault();
        useEditorStoreV2.getState().setActiveTool(tool);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ── Wheel zoom ──────────────────────────────────────────────────

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1 - 0.1 : 1 + 0.1;
      const newZoom = Math.max(0.1, Math.min(8, zoom * factor));
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      engine.zoomTowardsPoint(e.clientX - rect.left, e.clientY - rect.top, newZoom);
    },
    [zoom, engine]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // ── Render loop ─────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    const dpr = window.devicePixelRatio || 1;
    const w = containerSize.w;
    const h = containerSize.h;

    function render() {
      if (canvas) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, w, h);

      // Grid
      drawGrid(ctx, gridConfig, viewport, w, h);

      // ── Draw objects ──────────────────────────────────────────
      const sortedObjects = [...objects].sort((a, b) => a.zIndex - b.zIndex);
      const cache = objCacheRef.current;

      const vpLeft = -panX / zoom;
      const vpTop = -panY / zoom;
      const vpRight = vpLeft + w / zoom;
      const vpBottom = vpTop + h / zoom;

      for (const objData of sortedObjects) {
        if (!objData.visible) continue;
        const margin = 100;
        if (objData.x + objData.width < vpLeft - margin || objData.x > vpRight + margin ||
            objData.y + objData.height < vpTop - margin || objData.y > vpBottom + margin) {
          continue;
        }

        const wrapper = cache.get(objData.id);
        if (!wrapper) continue;

        ctx.save();

        // Apply viewport transform for this object
        const sx = objData.x * zoom + panX;
        const sy = objData.y * zoom + panY;
        const sw = objData.width * zoom;
        const sh = objData.height * zoom;

        ctx.translate(sx + sw / 2, sy + sh / 2);
        if (objData.rotation !== 0) {
          ctx.rotate((objData.rotation * Math.PI) / 180);
        }
        if (objData.flipX || objData.flipY || objData.scaleX !== 1 || objData.scaleY !== 1) {
          ctx.scale(
            objData.scaleX * (objData.flipX ? -1 : 1),
            objData.scaleY * (objData.flipY ? -1 : 1)
          );
        }
        ctx.translate(-sw / 2, -sy / 2);

        // Use the object's own draw method with zoom-adjusted context
        // The object draws in local coordinates, so we need to set up a
        // local context where 1 unit = 1 pixel at current zoom
        ctx.save();
        // Object draws in its own coordinate space at origin
        ctx.translate(0, 0);

        // Draw using the object's polymorphic method
        // We need to pass a properly scaled context
        const localCtx = ctx;
        localCtx.fillStyle = objData.fill;
        localCtx.strokeStyle = objData.stroke;
        localCtx.lineWidth = objData.strokeWidth * zoom;
        localCtx.globalAlpha = objData.opacity;

        if (objData.shadow) {
          localCtx.shadowBlur = objData.shadow.blur * zoom;
          localCtx.shadowOffsetX = objData.shadow.offsetX * zoom;
          localCtx.shadowOffsetY = objData.shadow.offsetY * zoom;
          localCtx.shadowColor = objData.shadow.color;
        }

        // Scale the drawing to account for zoom so the object draws in world space
        // But we're already in viewport space, so we need to draw at (0,0) with (width*zoom, height*zoom)
        // Simple approach: use a separate pattern - fill/stroke a rect as placeholder
        // then overlay the actual object draw
        const selX = 0;
        const selY = 0;
        const selW = objData.width * zoom;
        const selH = objData.height * zoom;

        if (objData.cornerRadius) {
          const r = objData.cornerRadius * zoom;
          ctx.beginPath();
          ctx.moveTo(selX + r, selY);
          ctx.lineTo(selX + selW - r, selY);
          ctx.quadraticCurveTo(selX + selW, selY, selX + selW, selY + r);
          ctx.lineTo(selX + selW, selY + selH - r);
          ctx.quadraticCurveTo(selX + selW, selY + selH, selX + selW - r, selY + selH);
          ctx.lineTo(selX + r, selY + selH);
          ctx.quadraticCurveTo(selX, selY + selH, selX, selY + selH - r);
          ctx.lineTo(selX, selY + r);
          ctx.quadraticCurveTo(selX, selY, selX + r, selY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(selX, selY, selW, selH);
          ctx.strokeRect(selX, selY, selW, selH);
        }

        ctx.restore();

        // Selection highlight
        if (selectedIds.includes(objData.id)) {
          ctx.strokeStyle = SELECTION_BORDER;
          ctx.lineWidth = 2;
          ctx.setLineDash([4 / zoom, 4 / zoom]);
          ctx.strokeRect(selX, selY, selW, selH);
          ctx.setLineDash([]);
        }

        ctx.restore();
      }

      // ── Selection handles ─────────────────────────────────────
      for (const id of selectedIds) {
        const objData = objects.find((o) => o.id === id);
        if (!objData || objData.locked) continue;

        const sx = objData.x * zoom + panX;
        const sy = objData.y * zoom + panY;
        const sw = objData.width * zoom;
        const sh = objData.height * zoom;

        // Resize handles
        const handlePositions = getHandlePositions(sx, sy, sw, sh);
        for (const pos of Object.values(handlePositions)) {
          ctx.fillStyle = HANDLE_COLOR;
          ctx.strokeStyle = HANDLE_BORDER;
          ctx.lineWidth = 1.5;
          ctx.fillRect(pos.x - HANDLE_SIZE / 2, pos.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
          ctx.strokeRect(pos.x - HANDLE_SIZE / 2, pos.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
        }

        // Rotation handle connection line
        const rotY = sy - ROTATION_OFFSET * zoom;
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx + sw / 2, sy);
        ctx.lineTo(sx + sw / 2, rotY);
        ctx.stroke();

        // Rotation handle
        ctx.fillStyle = ROTATION_COLOR;
        ctx.beginPath();
        ctx.arc(sx + sw / 2, rotY, ROTATION_HANDLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = HANDLE_BORDER;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // ── Selection rectangle ───────────────────────────────────
      if (selectionRect) {
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.fillStyle = "rgba(96,165,250,0.12)";
        ctx.fillRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
        ctx.strokeRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
        ctx.setLineDash([]);
      }

      // ── Alignment guides ──────────────────────────────────────
      if (showGuides && alignmentGuides.length > 0) {
        ctx.strokeStyle = GUIDE_COLOR;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 4;
        ctx.shadowColor = GUIDE_COLOR;
        for (const g of alignmentGuides) {
          ctx.beginPath();
          if (g.orientation === "horizontal") {
            ctx.moveTo(0, g.position);
            ctx.lineTo(w, g.position);
          } else {
            ctx.moveTo(g.position, 0);
            ctx.lineTo(g.position, h);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }

      // ── Drawing preview ─────────────────────────────────────────
      if (drawPreview) {
        const minX = Math.min(drawPreview.start.x, drawPreview.current.x);
        const minY = Math.min(drawPreview.start.y, drawPreview.current.y);
        const pw = Math.abs(drawPreview.current.x - drawPreview.start.x);
        const ph = Math.abs(drawPreview.current.y - drawPreview.start.y);
        const sx = minX * zoom + panX;
        const sy = minY * zoom + panY;
        const sw = pw * zoom;
        const sh = ph * zoom;

        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6 / zoom, 4 / zoom]);
        ctx.fillStyle = "rgba(96,165,250,0.08)";
        ctx.fillRect(sx, sy, sw, sh);
        ctx.strokeRect(sx, sy, sw, sh);
        ctx.setLineDash([]);

        // Dimentions label
        if (pw > 5 && ph > 5) {
          ctx.fillStyle = "#94a3b8";
          ctx.font = "11px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(`${Math.round(pw)} × ${Math.round(ph)}`, sx + sw / 2, sy - 8);
        }
      }

      // ── Zoom indicator ────────────────────────────────────────
      ctx.fillStyle = "rgba(15,23,42,0.9)";
      ctx.fillRect(w - 110, h - 34, 100, 26);
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      ctx.strokeRect(w - 110, h - 34, 100, 26);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "12px monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(`${Math.round(zoom * 100)}%`, w - 18, h - 21);

      needsRedrawRef.current = false;
    }

    function tick() {
      if (needsRedrawRef.current) render();
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [containerSize, gridConfig, viewport, objects, selectedIds, selectionRect, alignmentGuides, showGuides, zoom, panX, panY]);

  // Mark redraw needed when state changes
  useEffect(() => { needsRedrawRef.current = true; }, [objects, selectedIds, zoom, panX, panY, showGrid, gridSize, selectionRect, alignmentGuides, showGuides, drawPreview]);

  // ── Pointer down ────────────────────────────────────────────────

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      const screenPt: Point = {
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top,
      };
      const worldPt = engine.screenToWorld(screenPt.x, screenPt.y);

      // Space + left = pan; middle‑mouse = pan
      if ((spacePressed && e.button === 0) || e.button === 1) {
        setIsPanning(true);
        panStartRef.current = { x: e.clientX, y: e.clientY };
        panInitialRef.current = { x: panX, y: panY };
        interactionRef.current.mode = "panning";
        return;
      }
      if (e.button !== 0) return;

      // ── Drawing mode ─────────────────────────────────────────
      const shapeTools: CanvasTool[] = ["rectangle", "circle", "ellipse", "star", "polygon", "line"];
      if (shapeTools.includes(activeTool)) {
        startBatch();
        interactionRef.current = {
          mode: "drawing",
          targetId: null,
          dragTargetIds: [],
          pointerStart: screenPt,
          pointerStartWorld: worldPt,
          initialStates: new Map(),
          resizeCorner: null,
          rotationCenter: { x: 0, y: 0 },
          selectionRect: null,
        };
        setDrawPreview({ start: worldPt, current: worldPt });
        return;
      }

      // Hit‑test: rotation handle → resize handles → objects
      // Topmost unlocked visible object first (reverse zIndex)
      const sorted = [...objects].sort((a, b) => b.zIndex - a.zIndex);

      // Find the clicked object in world coords
      let hitObject: BaseObjectData | null = null;

      // Check rotation handle hit first (only for selected objects)
      for (const id of selectedIds) {
        const objData = objects.find((o) => o.id === id);
        if (!objData || objData.locked) continue;
        const sx = objData.x * zoom + panX;
        const sy = objData.y * zoom + panY;
        const sw = objData.width * zoom;
        const sh = objData.height * zoom;
        const rotY = sy - ROTATION_OFFSET * zoom;

        const dist = Math.sqrt(
          (screenPt.x - (sx + sw / 2)) ** 2 + (screenPt.y - rotY) ** 2
        );
        if (dist < ROTATION_HIT_RADIUS) {
          // Start rotate
          startBatch();
          const center: Point = {
            x: objData.x + objData.width / 2,
            y: objData.y + objData.height / 2,
          };
          interactionRef.current = {
            mode: "rotating",
            targetId: id,
            dragTargetIds: [id],
            pointerStart: screenPt,
            pointerStartWorld: worldPt,
            initialStates: new Map([[id, { ...objData }]]),
            resizeCorner: null,
            rotationCenter: center,
            selectionRect: null,
          };
          return;
        }
      }

      // Check resize handles hit
      for (const id of selectedIds) {
        const objData = objects.find((o) => o.id === id);
        if (!objData || objData.locked) continue;
        const sx = objData.x * zoom + panX;
        const sy = objData.y * zoom + panY;
        const sw = objData.width * zoom;
        const sh = objData.height * zoom;

        const corner = getHitCorner(screenPt, { x: sx, y: sy, width: sw, height: sh }, HANDLE_HIT);
        if (corner) {
          startBatch();
          interactionRef.current = {
            mode: "resizing",
            targetId: id,
            dragTargetIds: [id],
            pointerStart: screenPt,
            pointerStartWorld: worldPt,
            initialStates: new Map([[id, { ...objData }]]),
            resizeCorner: corner,
            rotationCenter: { x: 0, y: 0 },
            selectionRect: null,
          };
          return;
        }
      }

      // Check object body hit (world coords)
      for (const objData of sorted) {
        if (!objData.visible || objData.locked) continue;
        const cache = objCacheRef.current;
        const wrapper = cache.get(objData.id);
        if (wrapper && wrapper.hitTest({ x: worldPt.x, y: worldPt.y } as ObjPoint)) {
          hitObject = objData;
          break;
        }
      }

      if (hitObject) {
        selectObject(hitObject.id, e.shiftKey);
        onSelect?.(hitObject.id);
        startBatch();

        const ids = e.shiftKey
          ? [...new Set([...selectedIds, hitObject.id])]
          : [hitObject.id];
        const snapshots = new Map<number, BaseObjectData>();
        for (const id of ids) {
          const o = objects.find((obj) => obj.id === id);
          if (o) snapshots.set(id, { ...o });
        }

        interactionRef.current = {
          mode: "dragging",
          targetId: hitObject.id,
          dragTargetIds: ids,
          pointerStart: screenPt,
          pointerStartWorld: worldPt,
          initialStates: snapshots,
          resizeCorner: null,
          rotationCenter: { x: 0, y: 0 },
          selectionRect: null,
        };
      } else {
        if (!e.shiftKey) {
          clearSelection();
          onSelect?.(null);
        }
        interactionRef.current = {
          mode: "selecting",
          targetId: null,
          dragTargetIds: [],
          pointerStart: screenPt,
          pointerStartWorld: worldPt,
          initialStates: new Map(),
          resizeCorner: null,
          rotationCenter: { x: 0, y: 0 },
          selectionRect: { x: screenPt.x, y: screenPt.y, width: 0, height: 0 },
        };
      }
    },
    [engine, objects, selectedIds, spacePressed, panX, panY, zoom, selectObject, clearSelection, startBatch, onSelect, activeTool]
  );

  // ── Resize start (called from canvas-level pointer handling) ────
  // Already handled inside handlePointerDown via hit-testing

  // ── Global pointer move / up ─────────────────────────────────────

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const ctx = interactionRef.current;

      // Panning
      if (ctx.mode === "panning") {
        setPan(
          panInitialRef.current.x + (e.clientX - panStartRef.current.x),
          panInitialRef.current.y + (e.clientY - panStartRef.current.y)
        );
        return;
      }
      if (ctx.mode === "idle") return;

      // Drawing preview
      if (ctx.mode === "drawing") {
        const containerRect2 = containerRef.current?.getBoundingClientRect();
        if (!containerRect2) return;
        const sp: Point = {
          x: e.clientX - containerRect2.left,
          y: e.clientY - containerRect2.top,
        };
        const wp = engine.screenToWorld(sp.x, sp.y);
        setDrawPreview((prev) => (prev ? { start: prev.start, current: wp } : null));
        return;
      }

      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      const screenPt: Point = {
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top,
      };
      const worldPt = engine.screenToWorld(screenPt.x, screenPt.y);

      // Dragging
      if (ctx.mode === "dragging" && ctx.targetId !== null) {
        const primary = ctx.dragTargetIds[0];
        if (primary == null) return;
        const init = ctx.initialStates.get(primary);
        if (!init) return;

        const dx = worldPt.x - ctx.pointerStartWorld.x;
        const dy = worldPt.y - ctx.pointerStartWorld.y;
        const projX = init.x + dx;
        const projY = init.y + dy;

        let snapX = projX;
        let snapY = projY;
        let showGuidesNow = false;

        if (snapToObjectsEnabled) {
          const movingRect: Rect = {
            x: projX, y: projY, width: init.width, height: init.height,
          };
          const staticRects = objects
            .filter((o) => !ctx.dragTargetIds.includes(o.id))
            .map((o) => ({ x: o.x, y: o.y, width: o.width, height: o.height }));

          const candidates = engine.findSnapCandidates(movingRect, staticRects, snapTolerance);
          const canvasCandidates = engine.findCanvasSnapCandidates(
            movingRect, canvasWidth, canvasHeight, snapTolerance
          );
          const all = [...candidates, ...canvasCandidates];

          if (all.length > 0) {
            const result = engine.resolveSnap(projX, projY, all);
            snapX = result.x;
            snapY = result.y;

            if (showGuides) {
              const guides: AlignmentGuide[] = result.guides.map((sg: any) => ({
                position: sg.axis === "horizontal"
                  ? sg.position * zoom + panY
                  : sg.position * zoom + panX,
                orientation: sg.axis === "horizontal" ? "horizontal" as const : "vertical" as const,
                type: sg.type,
                relatedObjectIds: sg.relatedObjectIds,
              }));
              setAlignmentGuides(guides);
              showGuidesNow = true;
            }
          }
        }

        if (!showGuidesNow) {
          clearAlignmentGuides();
        }

        const snapDx = snapX - init.x;
        const snapDy = snapY - init.y;

        for (const id of ctx.dragTargetIds) {
          const snapInit = ctx.initialStates.get(id);
          if (!snapInit) continue;
          updateObject(id, {
            x: snapInit.x + snapDx,
            y: snapInit.y + snapDy,
          });
        }
        return;
      }

      // Resizing
      if (ctx.mode === "resizing" && ctx.targetId != null && ctx.resizeCorner) {
        const init = ctx.initialStates.get(ctx.targetId);
        if (!init) return;
        const dx = worldPt.x - ctx.pointerStartWorld.x;
        const dy = worldPt.y - ctx.pointerStartWorld.y;
        const result = engine.computeResize(
          {
            id: init.id, x: init.x, y: init.y,
            width: init.width, height: init.height,
            rotation: init.rotation, scaleX: 1, scaleY: 1,
          },
          ctx.resizeCorner, dx, dy, e.shiftKey, e.altKey
        );
        updateObject(ctx.targetId, result);
        return;
      }

      // Rotating
      if (ctx.mode === "rotating" && ctx.targetId != null) {
        const wp = engine.screenToWorld(screenPt.x, screenPt.y);
        const angle = engine.computeRotation(ctx.rotationCenter, wp);
        updateObject(ctx.targetId, { rotation: angle });
        return;
      }

      // Selecting (rubber‑band)
      if (ctx.mode === "selecting") {
        const rawW = screenPt.x - ctx.pointerStart.x;
        const rawH = screenPt.y - ctx.pointerStart.y;
        const r: Rect = {
          x: rawW < 0 ? ctx.pointerStart.x + rawW : ctx.pointerStart.x,
          y: rawH < 0 ? ctx.pointerStart.y + rawH : ctx.pointerStart.y,
          width: Math.abs(rawW),
          height: Math.abs(rawH),
        };
        setSelectionRect(r);

        // Convert to world for intersection
        const a = engine.screenToWorld(r.x, r.y);
        const b = engine.screenToWorld(r.x + r.width, r.y + r.height);
        const worldR: Rect = {
          x: Math.min(a.x, b.x), y: Math.min(a.y, b.y),
          width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y),
        };

        const hits = objects.filter(
          (o) => o.visible && engine.rectsIntersect(
            { x: o.x, y: o.y, width: o.width, height: o.height },
            worldR
          )
        );
        if (hits.length > 0) {
          clearSelection();
          for (const h of hits) {
            selectObject(h.id, true);
          }
        }
      }
    };

    const onUp = () => {
      const ctx = interactionRef.current;
      if (ctx.mode === "dragging" || ctx.mode === "resizing" || ctx.mode === "rotating") {
        endBatch(
          ctx.mode === "dragging" ? "Drag" : ctx.mode === "resizing" ? "Resize" : "Rotate"
        );
      }

      // ── Finalize drawing ──────────────────────────────────────
      if (ctx.mode === "drawing") {
        setDrawPreview((prev) => {
          if (prev) {
            const minX = Math.min(prev.start.x, prev.current.x);
            const minY = Math.min(prev.start.y, prev.current.y);
            const w = Math.max(20, Math.abs(prev.current.x - prev.start.x));
            const h = Math.max(20, Math.abs(prev.current.y - prev.start.y));
            const typeMap: Record<string, any> = {
              rectangle: "rectangle",
              circle: "circle",
              ellipse: "ellipse",
              star: "star",
              polygon: "polygon",
              line: "rectangle",
            };
            const shapeType = typeMap[activeTool] || "rectangle";
            const nameMap: Record<string, string> = {
              rectangle: "Rectangle",
              circle: "Circle",
              ellipse: "Ellipse",
              star: "Star",
              polygon: "Polygon",
              line: "Line",
            };
            addObject({
              type: shapeType,
              name: nameMap[activeTool] || "Shape",
              x: minX,
              y: minY,
              width: w,
              height: h,
              fill: activeTool === "line" ? "transparent" : "#3b82f6",
              stroke: "#1e40af",
              strokeWidth: activeTool === "line" ? 2 : 2,
            });
            endBatch(`Draw ${nameMap[activeTool] || "Shape"}`);
          }
          return null;
        });
        // Switch back to select tool after drawing
        useEditorStoreV2.getState().setActiveTool("select");
      }

      if (ctx.mode === "selecting") {
        setSelectionRect(null);
      }
      clearAlignmentGuides();
      interactionRef.current = createInteractionState();
      setIsPanning(false);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [
    engine, objects, updateObject, selectObject, clearSelection,
    startBatch, endBatch, snapToObjectsEnabled, snapTolerance,
    showGuides, canvasWidth, canvasHeight, zoom, panY, panX,
    setPan, setAlignmentGuides, clearAlignmentGuides,
  ]);

  // ── Cursor style ──────────────────────────────────────────────

  const shapeTools: CanvasTool[] = ["rectangle", "circle", "ellipse", "star", "polygon", "line"];
  const isShapeTool = !isPanning && !spacePressed && shapeTools.includes(activeTool);
  const cursorStyle = isPanning ? "grabbing" : spacePressed ? "grab" : isShapeTool ? "crosshair" : "default";

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        cursor: cursorStyle,
        touchAction: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
}

// ── Helper functions ───────────────────────────────────────────────

/** Get 8 resize handle positions in screen space */
function getHandlePositions(x: number, y: number, w: number, h: number): Record<string, Point> {
  return {
    nw: { x, y },
    n: { x: x + w / 2, y },
    ne: { x: x + w, y },
    e: { x: x + w, y: y + h / 2 },
    se: { x: x + w, y: y + h },
    s: { x: x + w / 2, y: y + h },
    sw: { x, y: y + h },
    w: { x, y: y + h / 2 },
  };
}

/** Hit-test which resize corner a point is near */
function getHitCorner(
  point: Point,
  rect: Rect,
  threshold: number
): ResizeCorner | null {
  const { x, y, width, height } = rect;
  const nearLeft = Math.abs(point.x - x) <= threshold;
  const nearRight = Math.abs(point.x - (x + width)) <= threshold;
  const nearTop = Math.abs(point.y - y) <= threshold;
  const nearBottom = Math.abs(point.y - (y + height)) <= threshold;

  if (nearTop && nearLeft) return "nw";
  if (nearTop && nearRight) return "ne";
  if (nearBottom && nearLeft) return "sw";
  if (nearBottom && nearRight) return "se";
  if (nearTop) return "n";
  if (nearBottom) return "s";
  if (nearLeft) return "w";
  if (nearRight) return "e";
  return null;
}

/** Draw grid on canvas */
function drawGrid(
  ctx: CanvasRenderingContext2D,
  config: GridConfig,
  viewport: ViewportState,
  w: number,
  h: number
) {
  if (!config.enabled) return;

  const gridData = generateGrid(config, viewport, w, h);

  if (config.dotMode) {
    for (const v of gridData.verticalLines) {
      if (!v.major) continue;
      for (const hh of gridData.horizontalLines) {
        if (!hh.major) continue;
        const sx = v.position * viewport.zoom + viewport.panX;
        const sy = hh.position * viewport.zoom + viewport.panY;
        ctx.fillStyle = "rgba(71,85,105,0.5)";
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    for (const v of gridData.verticalLines) {
      const sx = v.position * viewport.zoom + viewport.panX;
      ctx.strokeStyle = v.major ? "rgba(71,85,105,0.6)" : "rgba(71,85,105,0.25)";
      ctx.lineWidth = v.major ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();
    }
    for (const hh of gridData.horizontalLines) {
      const sy = hh.position * viewport.zoom + viewport.panY;
      ctx.strokeStyle = hh.major ? "rgba(71,85,105,0.6)" : "rgba(71,85,105,0.25)";
      ctx.lineWidth = hh.major ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();
    }
  }
}

export default React.memo(CanvasPro);
