"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type ProjectSelection = {
  id: string;
  name: string;
  designId: string;
  customerName: string;
  material: string;
  size: string;
  thickness: string;
  status: string;
  totalParts: number;
  totalSheets: number;
};

type ProjectContextValue = {
  project: ProjectSelection;
  setProject: (project: ProjectSelection) => void;
  updateProject: (updates: Partial<ProjectSelection>) => void;
};

const defaultProject: ProjectSelection = {
  id: "RA-205",
  name: "Royal Ganpati Arch",
  designId: "RA-205",
  customerName: "Aarav Decor",
  material: "Thermocol",
  size: "1200 × 800 mm",
  thickness: "12 mm",
  status: "Draft",
  totalParts: 18,
  totalSheets: 3,
};

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProjectState] = useState<ProjectSelection>(defaultProject);

  const setProject = (nextProject: ProjectSelection) => {
    setProjectState(nextProject);
  };

  const updateProject = (updates: Partial<ProjectSelection>) => {
    setProjectState((current) => ({ ...current, ...updates }));
  };

  const value = useMemo(() => ({ project, setProject, updateProject }), [project]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
