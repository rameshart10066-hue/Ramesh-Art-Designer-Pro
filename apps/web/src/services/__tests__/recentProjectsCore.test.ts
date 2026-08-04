import { describe, expect, it } from "vitest";
import {
  type RecentProject,
  type NewRecentProject,
  upsertRecentProject,
  removeRecentProject,
  touchRecentProject,
  togglePin,
  renameRecentProject,
  duplicateRecentProject,
  queryRecentProjects,
  isRecentProjectStorable,
  RECENT_PROJECTS_LIMIT,
} from "../recentProjectsCore";

const NOW = "2026-08-01T10:00:00.000Z";

function entry(name: string, overrides?: Partial<NewRecentProject>): NewRecentProject {
  return { name, objectsCount: 3, data: JSON.stringify({ name }), ...overrides };
}

describe("upsertRecentProject", () => {
  it("prepends a new project and caps the list at 10", () => {
    let list: RecentProject[] = [];
    for (let i = 0; i < RECENT_PROJECTS_LIMIT + 2; i++) {
      list = upsertRecentProject(list, entry(`Project ${i}`), RECENT_PROJECTS_LIMIT, NOW);
    }
    expect(list).toHaveLength(RECENT_PROJECTS_LIMIT);
    expect(list[0]!.name).toBe(`Project ${RECENT_PROJECTS_LIMIT + 1}`);
  });

  it("defaults pin to false for new entries", () => {
    const [project] = upsertRecentProject([], entry("New"), RECENT_PROJECTS_LIMIT, NOW);
    expect(project!.pinned).toBe(false);
  });

  it("dedupes by name and preserves the existing pin on update", () => {
    let list = upsertRecentProject([], entry("Royal"), RECENT_PROJECTS_LIMIT, NOW);
    list = togglePin(list, list[0]!.id);
    list = upsertRecentProject(list, entry("Royal", { objectsCount: 7 }), RECENT_PROJECTS_LIMIT, NOW);

    expect(list).toHaveLength(1);
    expect(list[0]!.objectsCount).toBe(7);
    expect(list[0]!.pinned).toBe(true); // pin survives a re-save
  });

  it("carries richer metadata onto new entries", () => {
    const [project] = upsertRecentProject(
      [],
      entry("Palace", { thumbnail: "<svg/>", size: "4×4 ft", theme: "Royal", material: "Thermocol", manufacturingStatus: "ready" }),
      RECENT_PROJECTS_LIMIT,
      NOW,
    );
    expect(project).toMatchObject({ thumbnail: "<svg/>", size: "4×4 ft", theme: "Royal", material: "Thermocol", manufacturingStatus: "ready" });
  });
});

describe("removeRecentProject", () => {
  it("removes only the matching project by id", () => {
    const a = toProject("A");
    const b = toProject("B");
    expect(removeRecentProject([a, b], a.id).map((p) => p.name)).toEqual(["B"]);
  });
});

describe("touchRecentProject", () => {
  it("bumps openedAt only and moves the project to the front", () => {
    const a = toProject("A", "2026-08-01T08:00:00.000Z");
    const b = toProject("B", "2026-08-01T09:00:00.000Z");
    const result = touchRecentProject([a, b], b.id, "2026-08-01T12:00:00.000Z");

    expect(result[0]!.name).toBe("B");
    expect(result[0]!.openedAt).toBe("2026-08-01T12:00:00.000Z");
    // modifiedAt is untouched — opening a project is not a modification.
    expect(result[0]!.modifiedAt).toBe("2026-08-01T09:00:00.000Z");
  });
});

describe("togglePin", () => {
  it("flips the pinned flag", () => {
    const a = toProject("A");
    expect(togglePin([a], a.id)[0]!.pinned).toBe(true);
    expect(togglePin([{ ...a, pinned: true }], a.id)[0]!.pinned).toBe(false);
  });
});

describe("renameRecentProject", () => {
  it("renames and refreshes modifiedAt", () => {
    const a = toProject("Old Name");
    const result = renameRecentProject([a], a.id, "New Name", "2026-08-01T11:00:00.000Z");
    expect(result[0]!.name).toBe("New Name");
    expect(result[0]!.modifiedAt).toBe("2026-08-01T11:00:00.000Z");
  });
});

describe("duplicateRecentProject", () => {
  it("creates a standalone copy with a Copy suffix and no pin", () => {
    const source = { ...toProject("Design"), pinned: true, material: "MDF" };
    const [copy] = duplicateRecentProject([source], source, NOW);
    expect(copy).toBeDefined();

    expect(copy!.id).not.toBe(source.id);
    expect(copy!.name).toBe("Design Copy");
    expect(copy!.pinned).toBe(false);
    expect(copy!.material).toBe("MDF");
    expect(copy!.data).toBe(source.data);
  });
});

describe("queryRecentProjects", () => {
  const list = [
    toProject("Beta", "2026-08-01T09:00:00.000Z", { material: "Thermocol" }),
    toProject("Alpha", "2026-08-01T10:00:00.000Z", { pinned: true }),
    toProject("Gamma", "2026-08-01T08:00:00.000Z", { theme: "Royal" }),
  ];

  it("sorts by modified desc by default and keeps pinned first", () => {
    const result = queryRecentProjects(list, {});
    expect(result.map((p) => p.name)).toEqual(["Alpha", "Beta", "Gamma"]);
  });

  it("searches by name and metadata", () => {
    expect(queryRecentProjects(list, { search: "thermocol" }).map((p) => p.name)).toEqual(["Beta"]);
    expect(queryRecentProjects(list, { search: "royal" }).map((p) => p.name)).toEqual(["Gamma"]);
  });

  it("sorts by name asc within the pinned-first grouping", () => {
    const result = queryRecentProjects(list, { sort: "name-asc" });
    expect(result.map((p) => p.name)).toEqual(["Alpha", "Beta", "Gamma"]);
  });
});

describe("isRecentProjectStorable", () => {
  it("flags oversized payloads", () => {
    expect(isRecentProjectStorable("x".repeat(10))).toBe(true);
    expect(isRecentProjectStorable("x".repeat(2_500_001))).toBe(false);
  });
});

// ── helpers ───────────────────────────────────────────────────────

function toProject(
  name: string,
  modifiedAt = NOW,
  extra?: { pinned?: boolean; material?: string; theme?: string },
): RecentProject {
  return {
    id: `id-${name}`,
    name,
    openedAt: modifiedAt,
    modifiedAt,
    pinned: extra?.pinned ?? false,
    objectsCount: 1,
    data: "{}",
    ...(extra?.material !== undefined && { material: extra.material }),
    ...(extra?.theme !== undefined && { theme: extra.theme }),
  };
}
