/**
 * Recent Projects — pure, testable core (Sprint 11.4).
 *
 * The zustand store (`@/stores/recentProjectsStore`) persists the list to
 * localStorage; this module holds the pure list-manipulation and query rules
 * so they can be unit-tested without a DOM or storage engine.
 *
 * Each entry carries rich metadata captured at save time — thumbnail, size,
 * theme, material and manufacturing status — plus a `pinned` flag.
 */

export type ManufacturingStatus = "none" | "ready" | "complete";

export interface RecentProject {
  /** Stable unique id (timestamp-based). */
  id: string;
  /** Display name, e.g. "Royal Palace — 4×4 ft" or "Untitled Design". */
  name: string;
  /** Original `.radp` file name when the project was opened from disk. */
  filePath?: string;
  /** ISO timestamp of the most recent open. */
  openedAt: string;
  /** ISO timestamp of the last save / change. */
  modifiedAt: string;
  /** SVG thumbnail of the design (data, not a URL). */
  thumbnail?: string;
  /** Display size, e.g. "4×4 ft" or "1219 × 1219 mm". */
  size?: string;
  /** Display theme, e.g. "Royal". */
  theme?: string;
  /** Display material, e.g. "Thermocol". */
  material?: string;
  /** Last manufacturing status captured when the project was recorded. */
  manufacturingStatus?: ManufacturingStatus;
  /** Pinned projects are always grouped at the top of the list. */
  pinned: boolean;
  /** Number of canvas objects, shown as a quick stat. */
  objectsCount: number;
  /**
   * Serialized project payload (`.radp` — full `ProjectFile` built through
   * `projectService`) so the project can be reopened without the original file.
   */
  data: string;
}

/**
 * Entry shape callers provide — id, timestamps and pin state are managed here
 * (pin defaults to `false` for brand-new entries and is preserved on updates).
 */
export type NewRecentProject = Omit<RecentProject, "id" | "openedAt" | "modifiedAt" | "pinned"> & {
  pinned?: boolean;
};

export const RECENT_PROJECTS_LIMIT = 10;

export type RecentSortKey = "modified-desc" | "modified-asc" | "name-asc" | "name-desc";

export interface RecentQuery {
  search?: string;
  sort?: RecentSortKey;
}

export const SORT_OPTIONS: { id: RecentSortKey; label: string }[] = [
  { id: "modified-desc", label: "Recently modified" },
  { id: "modified-asc", label: "Oldest first" },
  { id: "name-asc", label: "Name (A–Z)" },
  { id: "name-desc", label: "Name (Z–A)" },
];

// ── Construction ──────────────────────────────────────────────────

/** Normalize a raw entry into a full `RecentProject`; pin defaults to false. */
export function toRecentProject(entry: NewRecentProject, now = new Date().toISOString()): RecentProject {
  const project: RecentProject = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: entry.name,
    openedAt: now,
    modifiedAt: now,
    pinned: entry.pinned ?? false,
    objectsCount: entry.objectsCount,
    data: entry.data,
  };
  if (entry.filePath !== undefined) project.filePath = entry.filePath;
  if (entry.thumbnail !== undefined) project.thumbnail = entry.thumbnail;
  if (entry.size !== undefined) project.size = entry.size;
  if (entry.theme !== undefined) project.theme = entry.theme;
  if (entry.material !== undefined) project.material = entry.material;
  if (entry.manufacturingStatus !== undefined) project.manufacturingStatus = entry.manufacturingStatus;
  return project;
}

// ── List mutations ────────────────────────────────────────────────

/**
 * Insert or refresh a project in the list.
 *
 * - Dedupes by `name` (case-insensitive) — saving over a project bumps it to
 *   the top and refreshes `modifiedAt` + payload (pin/thumbnail preserved).
 * - New entries are prepended.
 * - The list is truncated to `limit`.
 */
export function upsertRecentProject(
  list: RecentProject[],
  entry: NewRecentProject,
  limit = RECENT_PROJECTS_LIMIT,
  now = new Date().toISOString(),
): RecentProject[] {
  const existing = list.find((p) => p.name.toLowerCase() === entry.name.toLowerCase());

  if (existing) {
    const updated: RecentProject = {
      ...existing,
      name: entry.name,
      modifiedAt: now,
      objectsCount: entry.objectsCount,
      data: entry.data,
    };
    if (entry.filePath !== undefined) updated.filePath = entry.filePath;
    if (entry.thumbnail !== undefined) updated.thumbnail = entry.thumbnail;
    if (entry.size !== undefined) updated.size = entry.size;
    if (entry.theme !== undefined) updated.theme = entry.theme;
    if (entry.material !== undefined) updated.material = entry.material;
    if (entry.manufacturingStatus !== undefined) updated.manufacturingStatus = entry.manufacturingStatus;
    // Move to front, keep the rest (minus the refreshed entry).
    return [updated, ...list.filter((p) => p.id !== updated.id)].slice(0, limit);
  }

  const created = toRecentProject(entry, now);
  return [created, ...list].slice(0, limit);
}

/** Remove a project by id. */
export function removeRecentProject(list: RecentProject[], id: string): RecentProject[] {
  return list.filter((p) => p.id !== id);
}

/** Bump a project's `openedAt` and move it to the front (used when reopening). */
export function touchRecentProject(
  list: RecentProject[],
  id: string,
  now = new Date().toISOString(),
): RecentProject[] {
  const target = list.find((p) => p.id === id);
  if (!target) return list;
  const updated: RecentProject = { ...target, openedAt: now };
  return [updated, ...list.filter((p) => p.id !== id)];
}

/** Toggle the pinned flag. */
export function togglePin(list: RecentProject[], id: string): RecentProject[] {
  return list.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p));
}

/** Rename a project, refreshing its `modifiedAt`. */
export function renameRecentProject(
  list: RecentProject[],
  id: string,
  name: string,
  now = new Date().toISOString(),
): RecentProject[] {
  return list.map((p) => (p.id === id ? { ...p, name, modifiedAt: now } : p));
}

/** Create a standalone copy of a project (new id, "Copy" suffix, not pinned). */
export function duplicateRecentProject(
  list: RecentProject[],
  project: RecentProject,
  now = new Date().toISOString(),
): RecentProject[] {
  const copy: RecentProject = {
    id: `dup-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: `${project.name} Copy`,
    openedAt: now,
    modifiedAt: now,
    pinned: false,
    objectsCount: project.objectsCount,
    data: project.data,
  };
  if (project.filePath !== undefined) copy.filePath = project.filePath;
  if (project.thumbnail !== undefined) copy.thumbnail = project.thumbnail;
  if (project.size !== undefined) copy.size = project.size;
  if (project.theme !== undefined) copy.theme = project.theme;
  if (project.material !== undefined) copy.material = project.material;
  if (project.manufacturingStatus !== undefined) copy.manufacturingStatus = project.manufacturingStatus;
  return [copy, ...list].slice(0, RECENT_PROJECTS_LIMIT);
}

// ── Query (search + sort) ─────────────────────────────────────────

/**
 * Filter by search (name / material / theme / size) and sort.
 * Pinned projects always sort ahead of unpinned ones, regardless of the key.
 */
export function queryRecentProjects(list: RecentProject[], query: RecentQuery = {}): RecentProject[] {
  const q = query.search?.trim().toLowerCase() ?? "";
  const filtered = list.filter((p) => {
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.material ?? "").toLowerCase().includes(q) ||
      (p.theme ?? "").toLowerCase().includes(q) ||
      (p.size ?? "").toLowerCase().includes(q)
    );
  });

  const sort = query.sort ?? "modified-desc";
  return [...filtered].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    switch (sort) {
      case "modified-asc":
        return a.modifiedAt.localeCompare(b.modifiedAt);
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      default:
        return b.modifiedAt.localeCompare(a.modifiedAt);
    }
  });
}

/** Guard against payloads too large to survive in localStorage. */
export function isRecentProjectStorable(data: string, maxBytes = 2_500_000): boolean {
  return data.length <= maxBytes;
}
