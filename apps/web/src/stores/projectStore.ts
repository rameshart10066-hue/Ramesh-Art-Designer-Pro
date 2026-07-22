"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProjectStoreShape = {
  id: string;
  customerName: string;
  projectName: string;
  designId: string;
  designName: string;
  width: string;
  height: string;
  material: string;
  thickness: string;
  pillarStyle: string;
  haloStyle: string;
  borderStyle: string;
  platformStyle: string;
  colorTheme: string;
  estimatedSheets: number;
  estimatedCost: number;
  estimatedCuttingTime: number;
  currentStep: string;
};

export type ProjectStore = {
  project: ProjectStoreShape;
  isHydrated: boolean;
  setProject: (project: Partial<ProjectStoreShape>) => void;
  updateProject: (project: Partial<ProjectStoreShape>) => void;
  setCurrentStep: (step: string) => void;
  resetProject: () => void;
  markHydrated: () => void;
};

const initialProject: ProjectStoreShape = {
  id: "RA-205",
  customerName: "Aarav Decor",
  projectName: "Royal Ganpati Arch",
  designId: "RA-205",
  designName: "Royal Ganpati Arch",
  width: "1200 mm",
  height: "800 mm",
  material: "Thermocol",
  thickness: "12 mm",
  pillarStyle: "Royal",
  haloStyle: "Round",
  borderStyle: "Lotus",
  platformStyle: "Platform A",
  colorTheme: "Midnight Indigo",
  estimatedSheets: 3,
  estimatedCost: 145000,
  estimatedCuttingTime: 180,
  currentStep: "Design Studio",
};

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      project: initialProject,
      isHydrated: false,
      setProject: (project) => set((state) => ({ project: { ...state.project, ...project } })),
      updateProject: (project) => set((state) => ({ project: { ...state.project, ...project } })),
      setCurrentStep: (step) => set((state) => ({ project: { ...state.project, currentStep: step } })),
      resetProject: () => set({ project: initialProject }),
      markHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "ramesh-project-store",
      partialize: (state) => ({ project: state.project }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    }
  )
);

export const selectProject = () => useProjectStore((state) => state.project);
export const selectIsHydrated = () => useProjectStore((state) => state.isHydrated);
