import { describe, expect, it } from "vitest";
import type { BaseObjectData } from "@/types/objects";
import { DESIGN_TEMPLATES, getTemplate } from "@/services/templateEngine";
import {
  type CatalogItem,
  buildDuplicateItem,
  buildSeedItems,
  computeVirtualRange,
  deriveSize,
  deriveTheme,
  queryCatalogItems,
  renderObjectsPreviewSvg,
  resolveItemObjects,
} from "../catalogService";

const NOW = "2026-08-01T10:00:00.000Z";

describe("deriveSize / deriveTheme", () => {
  it("reads an explicit size tag when present", () => {
    const t = getTemplate("design-001")!;
    expect(deriveSize(t)).toBe("3x3");
  });

  it("infers size from complexity when there is no size tag", () => {
    const simple = getTemplate("ganpati-simple")!;
    expect(simple.tags.some((x) => /^\d+x\d+$/.test(x))).toBe(false);
    expect(deriveSize(simple)).toBe("3x3");
  });

  it("detects temple theme from tags or category", () => {
    expect(deriveTheme(getTemplate("temple-mandap")!)).toBe("temple");
  });

  it("maps the DNA style to a theme otherwise", () => {
    expect(deriveTheme(getTemplate("modern-minimal")!)).toBe("minimal");
    expect(deriveTheme(getTemplate("north-indian-royal")!)).toBe("royal");
  });
});

describe("buildSeedItems", () => {
  it("creates one catalog item per template with derived metadata", () => {
    const items = buildSeedItems(DESIGN_TEMPLATES, NOW);
    expect(items.length).toBe(DESIGN_TEMPLATES.length);

    const royal = items.find((i) => i.id === "design-001")!;
    expect(royal.templateId).toBe("design-001");
    expect(royal.size).toBe("3x3");
    expect(royal.favorite).toBe(false);
    expect(royal.createdAt).toBe(NOW);
    expect(royal.objects).toBeUndefined();
  });
});

describe("queryCatalogItems", () => {
  const items = buildSeedItems(DESIGN_TEMPLATES, NOW);

  it("filters by search across name and description", () => {
    const result = queryCatalogItems(items, { search: "mandap" });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((i) => i.name.toLowerCase().includes("mandap") || i.description.toLowerCase().includes("mandap"))).toBe(true);
  });

  it("filters by category, size and theme together", () => {
    const result = queryCatalogItems(items, { category: "ganpati", size: "3x3", theme: "royal" });
    expect(result.every((i) => i.category === "ganpati" && i.size === "3x3" && i.theme === "royal")).toBe(true);
  });

  it("filters to favorites only when requested", () => {
    const favorited = { ...items[0]!, favorite: true, id: "fav-1", updatedAt: NOW };
    const result = queryCatalogItems([...items.slice(1), favorited], { favoritesOnly: true });
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("fav-1");
  });

  it("sorts by updatedAt descending (newest first)", () => {
    const a = seedItem("a", "2026-08-01T08:00:00.000Z");
    const b = seedItem("b", "2026-08-01T09:00:00.000Z");
    const result = queryCatalogItems([a, b], {});
    expect(result.map((i) => i.id)).toEqual(["b", "a"]);
  });
});

describe("resolveItemObjects", () => {
  it("returns serialized objects for user-created items", () => {
    const objects = [makeObject({ id: 1 })];
    const item = seedItem("x", NOW, { objects });
    expect(resolveItemObjects(item)).toBe(objects);
  });

  it("instantiates the template for seed items", () => {
    const item = seedItem("design-001", NOW, { templateId: "design-001" });
    const objects = resolveItemObjects(item);
    expect(objects.length).toBeGreaterThan(0);
  });
});

describe("buildDuplicateItem", () => {
  it("creates a fresh copy with its own objects", () => {
    const source = seedItem("design-001", NOW);
    const objects = resolveItemObjects(source);
    const copy = buildDuplicateItem(source, objects, NOW);

    expect(copy.id).not.toBe(source.id);
    expect(copy.name).toBe(`${source.name} Copy`);
    expect(copy.favorite).toBe(false);
    expect(copy.templateId).toBeUndefined();
    expect(copy.objects).toEqual(objects);
  });
});

describe("renderObjectsPreviewSvg", () => {
  it("renders shapes and omits transparent fills", () => {
    const svg = renderObjectsPreviewSvg([makeObject({ fill: "#fff" }), makeObject({ fill: "transparent", id: 2 })]);
    expect(svg).toContain("<svg");
    expect(svg).toContain("fill=\"#fff\"");
    expect(svg).toContain("fill=\"none\"");
  });

  it("escapes text content", () => {
    const obj = makeObject({ type: "text", text: "A < B", id: 3 });
    const svg = renderObjectsPreviewSvg([obj]);
    expect(svg).toContain("A &lt; B");
    expect(svg).not.toContain("< B");
  });

  it("handles empty designs", () => {
    const svg = renderObjectsPreviewSvg([]);
    expect(svg).toContain("<svg");
  });
});

describe("computeVirtualRange", () => {
  it("renders from the top with overscan", () => {
    const range = computeVirtualRange({ scrollTop: 0, viewportHeight: 600, rowHeight: 300, columns: 4, totalItems: 25, overscan: 1 });
    expect(range.firstRow).toBe(0);
    expect(range.startIndex).toBe(0);
    expect(range.endIndex).toBe(16);
  });

  it("slices a window scrolled into the list and clamps to the end", () => {
    const range = computeVirtualRange({ scrollTop: 1200, viewportHeight: 600, rowHeight: 300, columns: 4, totalItems: 25, overscan: 1 });
    expect(range.firstRow).toBe(4);
    expect(range.startIndex).toBe(16);
    expect(range.endIndex).toBe(25);
  });

  it("returns empty indices for no items", () => {
    expect(computeVirtualRange({ scrollTop: 0, viewportHeight: 600, rowHeight: 300, columns: 4, totalItems: 0, overscan: 1 })).toEqual({
      firstRow: 0,
      startIndex: 0,
      endIndex: 0,
    });
  });
});

// ── helpers ───────────────────────────────────────────────────────

function seedItem(id: string, updatedAt: string, extra?: Partial<CatalogItem>): CatalogItem {
  return {
    id,
    name: `Design ${id}`,
    description: "A test design",
    category: "ganpati",
    icon: "🏛",
    tags: [],
    complexity: 3,
    size: "4x4",
    theme: "traditional",
    colorTheme: "#fff",
    favorite: false,
    createdAt: NOW,
    updatedAt,
    ...extra,
  };
}

function makeObject(overrides: Partial<BaseObjectData>): BaseObjectData {
  return {
    id: 1,
    type: "rectangle",
    category: "basic",
    name: "Test",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    flipX: false,
    flipY: false,
    opacity: 1,
    fill: "#fff",
    stroke: "#000",
    strokeWidth: 2,
    visible: true,
    locked: false,
    zIndex: 0,
    children: [],
    metadata: {},
    ...overrides,
  };
}
