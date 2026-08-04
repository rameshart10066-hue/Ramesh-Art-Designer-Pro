"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type RecentProject,
  type NewRecentProject,
  upsertRecentProject,
  removeRecentProject,
  touchRecentProject,
  togglePin as togglePinCore,
  renameRecentProject as renameCore,
  duplicateRecentProject,
  isRecentProjectStorable,
} from "@/services/recentProjectsCore";
import { renamePayloadName } from "@/services/projectIo";

type RecentProjectsStore = {
  projects: RecentProject[];
  isHydrated: boolean;
  /** Record a project open/save (deduped, capped at 10). */
  addProject: (entry: NewRecentProject) => void;
  removeProject: (id: string) => void;
  /** Bump openedAt and move to front (reopened from the Recent Projects page). */
  touchProject: (id: string) => void;
  togglePin: (id: string) => void;
  /** Rename and sync the name inside the stored payload. */
  renameProject: (id: string, name: string) => void;
  duplicateProject: (id: string) => void;
  clearProjects: () => void;
  markHydrated: () => void;
};

export const useRecentProjectsStore = create<RecentProjectsStore>()(
  persist(
    (set) => ({
      projects: [],
      isHydrated: false,

      addProject: (entry) =>
        set((state) => {
          // Oversized payloads (e.g. embedded images) still get recorded so the
          // entry shows in the list, but without a payload that could blow the
          // localStorage quota on rehydrate.
          const storable: NewRecentProject = { ...entry, data: isRecentProjectStorable(entry.data) ? entry.data : "" };
          return { projects: upsertRecentProject(state.projects, storable) };
        }),

      removeProject: (id) => set((state) => ({ projects: removeRecentProject(state.projects, id) })),

      touchProject: (id) => set((state) => ({ projects: touchRecentProject(state.projects, id) })),

      togglePin: (id) => set((state) => ({ projects: togglePinCore(state.projects, id) })),

      renameProject: (id, name) =>
        set((state) => ({
          projects: renameCore(state.projects, id, name).map((p) =>
            p.id === id && p.data ? { ...p, data: renamePayloadName(p.data, name) } : p,
          ),
        })),

      duplicateProject: (id) =>
        set((state) => {
          const source = state.projects.find((p) => p.id === id);
          if (!source) return state;
          return { projects: duplicateRecentProject(state.projects, source) };
        }),

      clearProjects: () => set({ projects: [] }),

      markHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "ramesh-recent-projects",
      partialize: (state) => ({ projects: state.projects }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);

export const selectRecentProjects = () => useRecentProjectsStore((state) => state.projects);
