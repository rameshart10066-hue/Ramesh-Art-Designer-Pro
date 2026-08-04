"use client";

import { create } from "zustand";
import type { ManufacturingState, NestingConfig, Sheet, PartData, CutOrderPlan, ToolpathMapping, MaterialEstimate } from "@/types/manufacturing";
import { DEFAULT_NESTING_CONFIG, DEFAULT_TOOLPATH_MAP } from "@/types/manufacturing";
import { runNesting } from "@/services/manufacturing/nestingEngine";
import { generateParts } from "@/services/manufacturing/partManager";
import { calculateEstimate } from "@/services/manufacturing/materialEstimator";
import { optimizeCutOrder } from "@/services/manufacturing/cutOrderOptimizer";

interface ManufacturingStore extends ManufacturingState {
  setSheetSize: (w: number, h: number) => void;
  setNestingConfig: (config: Partial<NestingConfig>) => void;
  runNestingFromObjects: (objects: any[], scale?: number, material?: string, thickness?: number) => void;
  selectSheet: (index: number) => void;
  togglePartLock: (objectId: number) => void;
  updateToolpathMapping: (index: number, mapping: Partial<ToolpathMapping>) => void;
  reset: () => void;
}

const initialState: ManufacturingState = {
  sheets: [],
  parts: [],
  nestingConfig: { ...DEFAULT_NESTING_CONFIG },
  toolpathMappings: [...DEFAULT_TOOLPATH_MAP],
  estimates: null,
  cutPlan: null,
  selectedSheetIndex: 0,
  scaleFactor: 1,
};

export const useManufacturingStore = create<ManufacturingStore>((set, get) => ({
  ...initialState,

  setSheetSize: (width, height) => {
    set((s) => ({ nestingConfig: { ...s.nestingConfig, sheetWidth: width, sheetHeight: height } }));
  },

  setNestingConfig: (config) => {
    set((s) => ({ nestingConfig: { ...s.nestingConfig, ...config } }));
  },

  runNestingFromObjects: (objects, scale = 1, material = "Thermocol", thickness = 12) => {
    const config = get().nestingConfig;
    const parts = generateParts(objects, scale, material, thickness);
    const { sheets, estimate } = runNesting(parts, config);
    const cutPlan = optimizeCutOrder(parts, sheets.flatMap((s) => s.placements), get().toolpathMappings);

    // Recalculate with sheet-based costs
    const detailedEstimate = calculateEstimate(parts, sheets, material);

    set({
      parts,
      sheets,
      estimates: detailedEstimate,
      cutPlan,
      selectedSheetIndex: 0,
    });
  },

  selectSheet: (index) => {
    const sheets = get().sheets;
    if (index >= 0 && index < sheets.length) {
      set({ selectedSheetIndex: index });
    }
  },

  togglePartLock: (objectId) => {
    set((s) => ({
      parts: s.parts.map((p) =>
        p.objectId === objectId ? { ...p, locked: !p.locked } : p,
      ),
    }));
  },

  updateToolpathMapping: (index, mapping) => {
    set((s) => ({
      toolpathMappings: s.toolpathMappings.map((m, i) =>
        i === index ? { ...m, ...mapping } : m,
      ),
    }));
  },

  reset: () => set({ ...initialState }),
}));
