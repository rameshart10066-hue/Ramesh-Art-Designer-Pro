"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AppSettings {
  /** Show the Quick Tips panel on the Welcome Dashboard. */
  showQuickTips: boolean;
  /** Show the Recent Projects panel on the Welcome Dashboard. */
  showRecentProjects: boolean;
  /** Default grid size (px) applied when the Design Studio opens. */
  gridSize: number;
  /** Default snap-to-grid state applied when the Design Studio opens. */
  snapToGrid: boolean;
  /** Auto-save the open project to localStorage while working. */
  autosaveEnabled: boolean;
  /** Autosave interval in minutes. */
  autosaveIntervalMinutes: number;
}

type AppSettingsStore = AppSettings & {
  isHydrated: boolean;
  updateSettings: (patch: Partial<AppSettings>) => void;
  markHydrated: () => void;
};

export const DEFAULT_SETTINGS: AppSettings = {
  showQuickTips: true,
  showRecentProjects: true,
  gridSize: 25,
  snapToGrid: false,
  autosaveEnabled: true,
  autosaveIntervalMinutes: 1,
};

export const useAppSettingsStore = create<AppSettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      isHydrated: false,
      updateSettings: (patch) => set(patch),
      markHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "ramesh-app-settings",
      partialize: (state) => ({
        showQuickTips: state.showQuickTips,
        showRecentProjects: state.showRecentProjects,
        gridSize: state.gridSize,
        snapToGrid: state.snapToGrid,
        autosaveEnabled: state.autosaveEnabled,
        autosaveIntervalMinutes: state.autosaveIntervalMinutes,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);
