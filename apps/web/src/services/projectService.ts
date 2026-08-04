/**
 * Project Service (.radp file format)
 *
 * Save/load complete project files including canvas state,
 * manufacturing data, templates, assets, and metadata.
 */

import type { BaseObjectData } from "@/types/objects";

export interface ProjectMetadata {
  name: string;
  author: string;
  version: string;
  created: string;
  modified: string;
  appVersion: string;
}

export interface ProjectFile {
  metadata: ProjectMetadata;
  canvas: {
    objects: BaseObjectData[];
    zoom: number;
    panX: number;
    panY: number;
    gridSize: number;
    showGrid: boolean;
    showGuides: boolean;
    snapToGrid: boolean;
    snapToObjects: boolean;
  };
  manufacturing: {
    sheets: any[];
    parts: any[];
    nestingConfig: any;
  };
  settings: Record<string, any>;
  assets: string[]; // base64-encoded assets
}

// ── Serialization ────────────────────────────────────────────────

export function createProjectFile(
  objects: BaseObjectData[],
  extras?: Partial<ProjectFile>,
): ProjectFile {
  const now = new Date().toISOString();
  return {
    metadata: {
      name: "Untitled Design",
      author: "",
      version: "1.0",
      created: now,
      modified: now,
      appVersion: "1.0.0",
    },
    canvas: {
      objects,
      zoom: 1,
      panX: 0,
      panY: 0,
      gridSize: 25,
      showGrid: true,
      showGuides: true,
      snapToGrid: false,
      snapToObjects: true,
    },
    manufacturing: {
      sheets: [],
      parts: [],
      nestingConfig: {},
    },
    settings: {},
    assets: [],
    ...extras,
  };
}

// ── Save ─────────────────────────────────────────────────────────

export function saveProject(
  project: ProjectFile,
  filename: string = "design.radp",
): void {
  project.metadata.modified = new Date().toISOString();
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".radp") ? filename : `${filename}.radp`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Load ─────────────────────────────────────────────────────────

export async function loadProject(file: File): Promise<ProjectFile | null> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as ProjectFile;
    if (!data.metadata || !data.canvas) {
      throw new Error("Invalid project file");
    }
    return data;
  } catch (err) {
    console.error("Failed to load project:", err);
    return null;
  }
}

// ── Autosave ─────────────────────────────────────────────────────

const AUTOSAVE_KEY = "ramesh-autosave";
const AUTOSAVE_INTERVAL = 60000; // 1 minute

export function getAutosave(): ProjectFile | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setAutosave(project: ProjectFile): void {
  try {
    project.metadata.modified = new Date().toISOString();
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(project));
  } catch {}
}

export function clearAutosave(): void {
  try { localStorage.removeItem(AUTOSAVE_KEY); } catch {}
}

export function startAutosave(
  getProject: () => ProjectFile,
  interval: number = AUTOSAVE_INTERVAL,
): () => void {
  const timer = setInterval(() => {
    try {
      const project = getProject();
      setAutosave(project);
    } catch {}
  }, interval);
  return () => clearInterval(timer);
}

// ── Backup ───────────────────────────────────────────────────────

const BACKUP_KEY_PREFIX = "ramesh-backup-";

export function createBackup(project: ProjectFile): void {
  const key = `${BACKUP_KEY_PREFIX}${Date.now()}`;
  try {
    localStorage.setItem(key, JSON.stringify(project));
  } catch {
    // Storage full — remove oldest backup
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(BACKUP_KEY_PREFIX)) keys.push(k);
    }
    keys.sort().slice(0, -5).forEach((k) => localStorage.removeItem(k));
  }
}

export function getRecentBackups(): { key: string; date: Date }[] {
  const backups: { key: string; date: Date }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(BACKUP_KEY_PREFIX)) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || "{}");
        backups.push({ key, date: new Date(data.metadata?.modified || Date.now()) });
      } catch {}
    }
  }
  return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
}
