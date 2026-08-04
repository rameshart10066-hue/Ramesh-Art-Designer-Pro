"use client";

/**
 * Project I/O — the single code path for saving/opening `.radp` files and
 * recording recent projects.
 *
 * Payloads are built through `projectService.createProjectFile` (the canonical
 * ProjectFile format), and every save/open enriches the recent-projects entry
 * with thumbnail + size/theme/material/manufacturing metadata captured from
 * the current stores. Two legacy file shapes remain readable:
 *
 *   1. Simple format:  `{ version, objects, timestamp }`
 *   2. Full format:    `{ metadata, canvas: { objects }, ... }` (ProjectFile)
 */

import type { BaseObjectData } from "@/types/objects";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";
import { useProjectStore } from "@/stores/projectStore";
import { useRecentProjectsStore } from "@/stores/recentProjectsStore";
import type { ManufacturingStatus } from "@/services/recentProjectsCore";
import { createProjectFile } from "@/services/projectService";
import { renderObjectsSvg } from "@/services/renderObjectsSvg";
import { APP_VERSION } from "@/version";

export const RADP_MIME = "application/json";

export interface RecentMeta {
  size?: string;
  theme?: string;
  material?: string;
  manufacturingStatus?: ManufacturingStatus;
}

/** Display name without the extension, e.g. "design.radp" → "design". */
export function stripRadpExtension(filename: string): string {
  return filename.replace(/\.radp$/i, "").replace(/\.json$/i, "");
}

/**
 * Extract the editable canvas objects from parsed project data.
 * Returns `null` when the payload is not a recognizable project file.
 */
export function extractObjectsFromProjectData(data: unknown): BaseObjectData[] | null {
  if (!data || typeof data !== "object") return null;

  const d = data as Record<string, unknown>;

  if (d.canvas && typeof d.canvas === "object") {
    const objects = (d.canvas as Record<string, unknown>).objects;
    if (Array.isArray(objects)) return objects as BaseObjectData[];
  }

  if (Array.isArray(d.objects)) return d.objects as BaseObjectData[];

  return null;
}

/** Read recently-captured metadata out of a ProjectFile payload. */
export function extractRecentMeta(data: unknown): Partial<RecentMeta> {
  if (!data || typeof data !== "object") return {};
  const settings = (data as { settings?: { recent?: Partial<RecentMeta> } }).settings?.recent;
  return settings && typeof settings === "object" ? settings : {};
}

/** Serialize the canvas into the simple `.radp` payload (legacy format). */
export function serializeProject(objects: BaseObjectData[], name: string): string {
  return JSON.stringify(
    {
      version: APP_VERSION,
      name: stripRadpExtension(name) || "Untitled Design",
      objects,
      timestamp: new Date().toISOString(),
    },
    null,
    2,
  );
}

/** Trigger a browser download for a `.radp` payload. */
export function downloadRadp(data: string, filename: string): void {
  const blob = new Blob([data], { type: RADP_MIME });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".radp") ? filename : `${filename}.radp`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Build the canonical ProjectFile payload (via projectService), embedding the
 * recent-project metadata so a reopened project can reconstruct its badges.
 */
function buildProjectPayload(objects: BaseObjectData[], name: string, meta: Partial<RecentMeta>): string {
  const now = new Date().toISOString();
  const file = createProjectFile(objects, {
    metadata: {
      name: stripRadpExtension(name) || "Untitled Design",
      author: "",
      version: "1.0",
      created: now,
      modified: now,
      appVersion: APP_VERSION,
    },
    settings: { recent: meta },
  });
  return JSON.stringify(file);
}

/**
 * Capture current project metadata (from the persisted project store) for a
 * recent-projects entry. Manufacturing status is intentionally NOT derived
 * here — it would pull the heavyweight manufacturing store into every page
 * that records projects. Callers that know the status (the Design Studio save
 * path) pass it explicitly via `meta`.
 */
function deriveRecentMeta(): Partial<RecentMeta> {
  const project = useProjectStore.getState().project;

  const meta: Partial<RecentMeta> = {};
  if (project.width && project.height) meta.size = `${project.width} × ${project.height}`;
  if (project.material) meta.material = project.material;
  if (project.designTheme || project.colorTheme) meta.theme = project.designTheme || project.colorTheme;
  return meta;
}

/**
 * Record an open/save in the recent-projects list. Builds (or reuses) the
 * ProjectFile payload, generates a thumbnail, and enriches metadata.
 * Returns the stored payload.
 */
export function recordRecentProject(entry: {
  name: string;
  filePath?: string;
  objects: BaseObjectData[];
  /** Override the serialized payload (e.g. when reopening an existing file). */
  data?: string;
  /** Override the derived metadata (e.g. when a caller knows it better). */
  meta?: Partial<RecentMeta>;
}): string {
  const meta = { ...deriveRecentMeta(), ...entry.meta };
  const thumbnail = renderObjectsSvg(entry.objects);
  const payload = entry.data ?? buildProjectPayload(entry.objects, entry.name, meta);

  useRecentProjectsStore.getState().addProject({
    name: stripRadpExtension(entry.name),
    ...(entry.filePath !== undefined && { filePath: entry.filePath }),
    objectsCount: entry.objects.length,
    data: payload,
    thumbnail,
    ...(meta.size !== undefined && { size: meta.size }),
    ...(meta.theme !== undefined && { theme: meta.theme }),
    ...(meta.material !== undefined && { material: meta.material }),
    ...(meta.manufacturingStatus !== undefined && { manufacturingStatus: meta.manufacturingStatus }),
  });

  return payload;
}

/**
 * Save the current canvas to a `.radp` file (ProjectFile payload) and record
 * it as a recent project. Returns the saved payload.
 * `meta` lets the caller enrich the record (e.g. manufacturing status).
 */
export function saveProjectToFile(
  objects: BaseObjectData[],
  filename = "design.radp",
  meta?: Partial<RecentMeta>,
): string {
  const safeName = filename.endsWith(".radp") ? filename : `${filename}.radp`;
  const payload = recordRecentProject({
    name: safeName,
    objects,
    ...(meta !== undefined && { meta }),
  });
  downloadRadp(payload, safeName);
  return payload;
}

/**
 * Load a project payload onto the canvas WITHOUT re-recording it as recent
 * (used by the Recent Projects page, which touches the entry separately).
 */
export function loadProjectData(raw: string): boolean {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return false;
  }
  const objects = extractObjectsFromProjectData(data);
  if (!objects) return false;
  useEditorStoreV2.getState().loadObjects(objects);
  return true;
}

/**
 * Parse `.radp` / `.json` file content, load it onto the canvas, and record it
 * as a recent project. Returns `true` on success.
 */
export function openProjectFromData(raw: string, sourceName: string): boolean {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return false;
  }

  const objects = extractObjectsFromProjectData(data);
  if (!objects) return false;

  useEditorStoreV2.getState().loadObjects(objects);
  recordRecentProject({
    name: sourceName,
    filePath: sourceName,
    objects,
    data: raw,
    meta: extractRecentMeta(data),
  });
  return true;
}

/** Open a `.radp` / `.json` `File` (from a file input / drag-drop). */
export async function openProjectFromFile(file: File): Promise<boolean> {
  try {
    const text = await file.text();
    return openProjectFromData(text, file.name);
  } catch {
    return false;
  }
}

/** Update the display name inside a serialized ProjectFile payload. */
export function renamePayloadName(data: string, name: string): string {
  try {
    const parsed = JSON.parse(data) as { metadata?: { name?: string } };
    if (parsed && typeof parsed === "object" && parsed.metadata && typeof parsed.metadata === "object") {
      parsed.metadata.name = stripRadpExtension(name);
      return JSON.stringify(parsed);
    }
  } catch {
    // Fall through — return the original payload on parse failure.
  }
  return data;
}
