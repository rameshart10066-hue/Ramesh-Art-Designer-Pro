import { create } from "zustand";
import type { BaseObjectData } from "@/types/objects";
import * as cmdHistory from "@/services/editor/commandHistoryService";
import * as selectionService from "@/services/editor/selectionService";
import type { AlignmentGuide } from "@/services/editor/alignmentService";
import type { AlignMode, FlipAxis } from "@/types/paths";
import type { ObjectGroup } from "@/services/editor/groupUtils";
import * as groupUtils from "@/services/editor/groupUtils";
import { alignObjects, flipObjects, distributeObjects } from "@/services/editor/alignmentUtils";

/**
 * Enhanced Editor Store with Command-Pattern Undo/Redo
 */

// ── Tool type ──────────────────────────────────────────────────

export type CanvasTool =
  | "select"
  | "rectangle"
  | "circle"
  | "ellipse"
  | "star"
  | "polygon"
  | "text"
  | "line"
  | "pan";

// ── Store interface ─────────────────────────────────────────────

interface EditorStoreV2 {
  // State
  objects: BaseObjectData[];
  selectedIds: number[];
  clipboard: BaseObjectData[];
  commandHistory: cmdHistory.CommandHistory;
  activeTool: CanvasTool;
  zoom: number;
  panX: number;
  panY: number;
  snapToGrid: boolean;
  snapToObjects: boolean;
  showGrid: boolean;
  showGuides: boolean;
  gridSize: number;
  horizontalGuides: number[];
  verticalGuides: number[];
  alignmentGuides: AlignmentGuide[];
  snapTolerance: number;
  groups: ObjectGroup[];

  // History with batching
  startBatch: () => void;
  endBatch: (description?: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Object actions (with automatic command creation)
  addObject: (obj: Partial<BaseObjectData>) => void;
  removeObject: (id: number) => void;
  updateObject: (id: number, updates: Partial<BaseObjectData>) => void;
  duplicateObject: (id: number) => void;
  loadObjects: (objects: BaseObjectData[]) => void;

  // Z-index
  bringForward: (id: number) => void;
  sendBackward: (id: number) => void;
  bringToFront: (id: number) => void;
  sendToBack: (id: number) => void;

  // Selection
  selectObject: (id: number, isMultiSelect?: boolean) => void;
  selectMultiple: (ids: number[]) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Clipboard
  copy: () => void;
  cut: () => void;
  paste: () => void;

  // Viewport
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;

  // Settings
  toggleGrid: () => void;
  toggleGuides: () => void;
  toggleSnapToGrid: () => void;
  toggleSnapToObjects: () => void;
  setGridSize: (size: number) => void;
  setShowGrid: (value: boolean) => void;
  setSnapToGrid: (value: boolean) => void;

  // Guides
  addHorizontalGuide: (y: number) => void;
  addVerticalGuide: (x: number) => void;
  removeHorizontalGuide: (y: number) => void;
  removeVerticalGuide: (x: number) => void;
  clearGuides: () => void;

  // Utilities
  getSelectedObjects: () => BaseObjectData[];
  getObjectById: (id: number) => BaseObjectData | undefined;

  // Alignment
  setAlignmentGuides: (guides: AlignmentGuide[]) => void;
  clearAlignmentGuides: () => void;
  setSnapTolerance: (tolerance: number) => void;

  // Active tool
  setActiveTool: (tool: CanvasTool) => void;
  // Groups
  groupObjects: (ids: number[]) => void;
  ungroupObjects: (groupId: number) => void;

  // Alignment
  alignSelectedObjects: (mode: AlignMode) => void;
  distributeSelectedObjects: (horizontal: boolean) => void;

  // Transform
  flipSelectedObjects: (axis: FlipAxis) => void;
}

let nextId = 1;

export const useEditorStoreV2 = create<EditorStoreV2>((set, get) => ({
  // Initial state
  objects: [],
  selectedIds: [],
  clipboard: [],
  commandHistory: cmdHistory.createCommandHistory(),
  activeTool: "select",
  zoom: 1,
  panX: 0,
  panY: 0,
  snapToGrid: false,
  snapToObjects: true,
  showGrid: true,
  showGuides: true,
  gridSize: 25,
  horizontalGuides: [],
  verticalGuides: [],
  alignmentGuides: [],
  snapTolerance: 8,
  groups: [],

  // History management
  startBatch: () => {
    set((state) => ({
      commandHistory: cmdHistory.startBatch(state.commandHistory),
    }));
  },

  endBatch: (description) => {
    set((state) => ({
      commandHistory: cmdHistory.endBatch(state.commandHistory, description),
    }));
  },

  undo: () => {
    const state = get();
    const result = cmdHistory.undo(state.commandHistory, state.objects);
    if (result) {
      set({
        commandHistory: result.history,
        objects: result.objects,
      });
    }
  },

  redo: () => {
    const state = get();
    const result = cmdHistory.redo(state.commandHistory, state.objects);
    if (result) {
      set({
        commandHistory: result.history,
        objects: result.objects,
      });
    }
  },

  canUndo: () => {
    return cmdHistory.canUndo(get().commandHistory);
  },

  canRedo: () => {
    return cmdHistory.canRedo(get().commandHistory);
  },

  // Object actions
  addObject: (obj) => {
    set((state) => {
      const newObject: BaseObjectData = {
        id: nextId++,
        type: (obj.type as any) || "rectangle",
        category: (obj.category as any) || "basic",
        name: obj.name || `Object ${nextId - 1}`,
        x: obj.x ?? 100,
        y: obj.y ?? 100,
        width: obj.width ?? 150,
        height: obj.height ?? 80,
        rotation: obj.rotation ?? 0,
        scaleX: obj.scaleX ?? 1,
        scaleY: obj.scaleY ?? 1,
        flipX: obj.flipX ?? false,
        flipY: obj.flipY ?? false,
        opacity: obj.opacity ?? 1,
        fill: obj.fill ?? "#334155",
        stroke: obj.stroke ?? "#475569",
        strokeWidth: obj.strokeWidth ?? 2,
        visible: obj.visible ?? true,
        locked: obj.locked ?? false,
        zIndex: obj.zIndex ?? state.objects.length,
        children: obj.children ?? [],
        metadata: obj.metadata ?? {},
        ...(obj.shadow !== undefined && { shadow: obj.shadow }),
        ...(obj.parentId !== undefined && { parentId: obj.parentId }),
        ...(obj.cornerRadius !== undefined && { cornerRadius: obj.cornerRadius }),
      };

      const command = cmdHistory.createAddCommand(newObject);
      const result = cmdHistory.executeCommand(state.commandHistory, state.objects, command);

      return {
        objects: result.objects,
        commandHistory: result.history,
      };
    });
  },

  removeObject: (id) => {
    set((state) => {
      const obj = state.objects.find((o) => o.id === id);
      if (!obj) return state;

      const command = cmdHistory.createDeleteCommand(obj);
      const result = cmdHistory.executeCommand(state.commandHistory, state.objects, command);

      return {
        objects: result.objects,
        commandHistory: result.history,
        selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
      };
    });
  },

  updateObject: (id, updates) => {
    set((state) => {
      const obj = state.objects.find((o) => o.id === id);
      if (!obj) return state;

      // Create commands for each property update
      const newHistory = Object.keys(updates).reduce((hist, key) => {
        const prop = key as keyof BaseObjectData;
        const command = cmdHistory.createPropertyCommand(
          id,
          prop,
          obj[prop],
          updates[prop] as any
        );
        return cmdHistory.addCommand(hist, command);
      }, state.commandHistory);

      const newObjects = state.objects.map((o) => (o.id === id ? { ...o, ...updates } : o));

      return {
        objects: newObjects,
        commandHistory: newHistory,
      };
    });
  },

  loadObjects: (objects) => {
    const maxId = objects.reduce((m, o) => Math.max(m, o.id), 0);
    nextId = maxId + 1;
    set({
      objects,
      selectedIds: [],
      commandHistory: cmdHistory.createCommandHistory(),
    });
  },

  duplicateObject: (id) => {
    set((state) => {
      const original = state.objects.find((obj) => obj.id === id);
      if (!original) return state;

      const duplicate: BaseObjectData = {
        ...original,
        id: nextId++,
        name: `${original.name} Copy`,
        x: original.x + 20,
        y: original.y + 20,
      };

      const command = cmdHistory.createDuplicateCommand(original, duplicate);
      const result = cmdHistory.executeCommand(state.commandHistory, state.objects, command);

      return {
        objects: result.objects,
        commandHistory: result.history,
        selectedIds: [duplicate.id],
      };
    });
  },

  // Z-index actions
  bringForward: (id) => {
    set((state) => {
      const obj = state.objects.find((o) => o.id === id);
      if (!obj) return state;

      const sorted = [...state.objects].sort((a, b) => a.zIndex - b.zIndex);
      const currentIndex = sorted.findIndex((o) => o.id === id);

      if (currentIndex === sorted.length - 1) return state;

      const nextObj = sorted[currentIndex + 1];
      if (!nextObj) return state;

      const command = cmdHistory.createZIndexCommand(
        id,
        obj.zIndex,
        nextObj.zIndex,
        [{ id: nextObj.id, fromZIndex: nextObj.zIndex, toZIndex: obj.zIndex }]
      );

      const result = cmdHistory.executeCommand(state.commandHistory, state.objects, command);

      return {
        objects: result.objects,
        commandHistory: result.history,
      };
    });
  },

  sendBackward: (id) => {
    set((state) => {
      const obj = state.objects.find((o) => o.id === id);
      if (!obj) return state;

      const sorted = [...state.objects].sort((a, b) => a.zIndex - b.zIndex);
      const currentIndex = sorted.findIndex((o) => o.id === id);

      if (currentIndex === 0) return state;

      const prevObj = sorted[currentIndex - 1];
      if (!prevObj) return state;

      const command = cmdHistory.createZIndexCommand(
        id,
        obj.zIndex,
        prevObj.zIndex,
        [{ id: prevObj.id, fromZIndex: prevObj.zIndex, toZIndex: obj.zIndex }]
      );

      const result = cmdHistory.executeCommand(state.commandHistory, state.objects, command);

      return {
        objects: result.objects,
        commandHistory: result.history,
      };
    });
  },

  bringToFront: (id) => {
    set((state) => {
      const obj = state.objects.find((o) => o.id === id);
      if (!obj) return state;

      const maxZIndex = Math.max(...state.objects.map((o) => o.zIndex), 0);
      const command = cmdHistory.createZIndexCommand(id, obj.zIndex, maxZIndex + 1, []);

      const result = cmdHistory.executeCommand(state.commandHistory, state.objects, command);

      return {
        objects: result.objects,
        commandHistory: result.history,
      };
    });
  },

  sendToBack: (id) => {
    set((state) => {
      const obj = state.objects.find((o) => o.id === id);
      if (!obj) return state;

      const minZIndex = Math.min(...state.objects.map((o) => o.zIndex), 0);
      const command = cmdHistory.createZIndexCommand(id, obj.zIndex, minZIndex - 1, []);

      const result = cmdHistory.executeCommand(state.commandHistory, state.objects, command);

      return {
        objects: result.objects,
        commandHistory: result.history,
      };
    });
  },

  // Selection actions (no undo needed)
  selectObject: (id, isMultiSelect = false) => {
    set((state) => ({
      selectedIds: selectionService.selectMultiple(state.selectedIds, id, isMultiSelect),
    }));
  },

  selectMultiple: (ids) => {
    set({ selectedIds: ids });
  },

  selectAll: () => {
    set((state) => ({
      selectedIds: selectionService.selectAll(state.objects),
    }));
  },

  clearSelection: () => {
    set({ selectedIds: selectionService.clearSelection() });
  },

  // Clipboard (with undo for cut)
  copy: () => {
    set((state) => ({
      clipboard: selectionService.getSelectedObjects(state.objects, state.selectedIds),
    }));
  },

  cut: () => {
    set((state) => {
      const selectedObjects = selectionService.getSelectedObjects(state.objects, state.selectedIds);

      // Create delete commands for all selected objects
      let newHistory = state.commandHistory;
      for (const obj of selectedObjects) {
        const command = cmdHistory.createDeleteCommand(obj);
        newHistory = cmdHistory.addCommand(newHistory, command);
      }

      const newObjects = state.objects.filter((obj) => !state.selectedIds.includes(obj.id));

      return {
        clipboard: selectedObjects,
        objects: newObjects,
        selectedIds: [],
        commandHistory: newHistory,
      };
    });
  },

  paste: () => {
    set((state) => {
      if (state.clipboard.length === 0) return state;

      const newObjects: BaseObjectData[] = state.clipboard.map((obj) => ({
        ...obj,
        id: nextId++,
        x: obj.x + 20,
        y: obj.y + 20,
      }));

      let newHistory = state.commandHistory;
      for (const obj of newObjects) {
        const command = cmdHistory.createAddCommand(obj);
        newHistory = cmdHistory.addCommand(newHistory, command);
      }

      return {
        objects: [...state.objects, ...newObjects],
        selectedIds: newObjects.map((o) => o.id),
        commandHistory: newHistory,
      };
    });
  },

  // Viewport (no undo needed)
  setZoom: (zoom) => {
    set({ zoom: Math.max(0.1, Math.min(8, zoom)) });
  },

  setPan: (x, y) => {
    set({ panX: x, panY: y });
  },

  resetView: () => {
    set({ zoom: 1, panX: 0, panY: 0 });
  },

  // Settings (no undo needed)
  toggleGrid: () => {
    set((state) => ({ showGrid: !state.showGrid }));
  },

  toggleGuides: () => {
    set((state) => ({ showGuides: !state.showGuides }));
  },

  toggleSnapToGrid: () => {
    set((state) => ({ snapToGrid: !state.snapToGrid }));
  },

  toggleSnapToObjects: () => {
    set((state) => ({ snapToObjects: !state.snapToObjects }));
  },

  setGridSize: (size) => {
    set({ gridSize: Math.max(5, Math.min(100, size)) });
  },

  setShowGrid: (value) => {
    set({ showGrid: value });
  },

  setSnapToGrid: (value) => {
    set({ snapToGrid: value });
  },

  // Guides (no undo needed)
  addHorizontalGuide: (y) => {
    set((state) => ({
      horizontalGuides: [...state.horizontalGuides, y],
    }));
  },

  addVerticalGuide: (x) => {
    set((state) => ({
      verticalGuides: [...state.verticalGuides, x],
    }));
  },

  removeHorizontalGuide: (y) => {
    set((state) => ({
      horizontalGuides: state.horizontalGuides.filter((guide) => guide !== y),
    }));
  },

  removeVerticalGuide: (x) => {
    set((state) => ({
      verticalGuides: state.verticalGuides.filter((guide) => guide !== x),
    }));
  },

  clearGuides: () => {
    set({ horizontalGuides: [], verticalGuides: [] });
  },

  // Utilities
  getSelectedObjects: () => {
    const state = get();
    return selectionService.getSelectedObjects(state.objects, state.selectedIds);
  },

  getObjectById: (id) => {
    const state = get();
    return state.objects.find((obj) => obj.id === id);
  },

  // Alignment
  setAlignmentGuides: (guides) => {
    set({ alignmentGuides: guides });
  },

  clearAlignmentGuides: () => {
    set({ alignmentGuides: [] });
  },

  setSnapTolerance: (tolerance) => {
    set({ snapTolerance: Math.max(1, Math.min(20, tolerance)) });
  },

  setActiveTool: (tool) => {
    set({ activeTool: tool });
  },


  groupObjects: (ids) => {
    const state = get();
    const group = groupUtils.createGroup(ids);
    set({ groups: [...state.groups, group] });
  },

  ungroupObjects: (groupId) => {
    const state = get();
    const { groups } = groupUtils.ungroup(state.groups, groupId);
    set({ groups });
  },

  alignSelectedObjects: (mode) => {
    const state = get();
    if (state.selectedIds.length < 2) return;
    state.startBatch();
    const newObjs = alignObjects(state.objects, state.selectedIds, mode);
    for (const obj of newObjs) {
      const orig = state.objects.find((o) => o.id === obj.id);
      if (orig && (orig.x !== obj.x || orig.y !== obj.y)) {
        state.updateObject(obj.id, { x: obj.x, y: obj.y });
      }
    }
  },

  distributeSelectedObjects: (horizontal) => {
    const state = get();
    if (state.selectedIds.length < 3) return;
    state.startBatch();
    const newObjs = distributeObjects(state.objects, state.selectedIds, horizontal);
    for (const obj of newObjs) {
      const orig = state.objects.find((o) => o.id === obj.id);
      if (orig && (orig.x !== obj.x || orig.y !== obj.y)) {
        state.updateObject(obj.id, { x: obj.x, y: obj.y });
      }
    }
    state.endBatch("Distribute");
  },
  flipSelectedObjects: (axis) => {
    const state = get();
    if (state.selectedIds.length === 0) return;
    state.startBatch();
    const newObjs = flipObjects(state.objects, state.selectedIds, axis);
    for (const obj of newObjs) {
      state.updateObject(obj.id, { x: obj.x, y: obj.y });
    }
    state.endBatch("Flip");
  },
}));
