/**
 * CAD Reconstructor — Sprint 10.4
 *
 * Converts matched detected components (Sprint 10.3) into EDITABLE parametric
 * canvas objects. The result can be opened directly on the design canvas via
 * the editor store's `loadObjects`:
 *
 *   - Each match → a `BaseObjectData` (type, geometry, ComponentDef default
 *     params stored in metadata) — everything remains editable in the studio.
 *   - A Design DNA is generated from the detected composition + colors.
 *   - A parent → child hierarchy is built from spatial containment and
 *     semantic roles (frame/border/stage/arch are containers).
 *   - Mirror symmetry is detected (pairs) and, where a symmetric partner is
 *     missing, a mirrored object is generated so the reconstruction stays
 *     symmetric about the vertical axis.
 *
 * Pure functions over `ComponentMatch[]` — no DOM, Node-testable.
 */

import type { BaseObjectData, ObjectType } from "@/types/objects";
import type { ComponentDef } from "@/types/components";
import { DEFAULT_DNA, type DesignDNA } from "@/product-model/DNAEngine";
import type { ComponentMatch } from "./ComponentMatcher";

export interface ReconstructionOptions {
  /** Canvas design space the reconstruction is scaled into. Default 1200×900. */
  canvasWidth?: number;
  canvasHeight?: number;
  /** Base DNA to mutate. Defaults to `DEFAULT_DNA`. */
  baseDna?: DesignDNA;
  /** Generate a mirrored partner for unpaired off-center components. Default true. */
  ensureSymmetry?: boolean;
  /** Starting id for generated objects. Default 10000. */
  idBase?: number;
}

export interface ReconstructionResult {
  /** Objects ready for `useEditorStoreV2.getState().loadObjects(objects)`. */
  objects: BaseObjectData[];
  dna: DesignDNA;
  hierarchy: HierarchyNode[];
  symmetryGroups: SymmetryGroup[];
  /** X coordinate of the vertical symmetry axis (canvas space). */
  centerX: number;
  /** Number of symmetry axes found / generated. */
  symmetryAxisCount: number;
}

export interface HierarchyNode {
  id: number;
  type: ObjectType;
  label: string;
  parentId: number | null;
  children: HierarchyNode[];
}

export interface SymmetryGroup {
  id: string;
  type: ObjectType;
  leftObjectId: number;
  rightObjectId: number;
  axisX: number;
  /** true when the right partner was generated (not detected). */
  generated: boolean;
}

// Detected type → canvas ObjectType (fallback when the matched def isn't valid).
const DETECTED_TO_OBJECT: Record<string, ObjectType> = {
  frame: "rectangle",
  border: "rectangle",
  background: "rectangle",
  arch: "arch",
  pillar: "pillar",
  stage: "base-platform",
  lotus: "lotus",
  bell: "bell",
  peacock: "peacock",
  prabhavali: "prabhavali",
  om: "om-symbol",
};

const VALID_OBJECT_TYPES = new Set<ObjectType>([
  "rectangle", "circle", "ellipse", "polygon", "star", "line", "text", "image", "svg",
  "mandap", "pillar", "arch", "dome", "base-platform", "lotus", "peacock", "kalash",
  "prabhavali", "om-symbol", "swastik", "deepak", "bell", "flower", "garland", "toran",
]);

// Semantic z-index: container-ish first, decorative details on top.
const Z_INDEX: Record<string, number> = {
  background: 0,
  frame: 10,
  border: 20,
  stage: 30,
  pillar: 40,
  arch: 50,
  prabhavali: 60,
  lotus: 70,
  om: 80,
  bell: 90,
  peacock: 100,
};

// Detected types that can be a parent (they enclose children spatially).
const CONTAINER_TYPES = new Set(["frame", "border", "background", "stage", "arch"]);

interface ObjectSpec {
  obj: BaseObjectData;
  detectedType: string;
  cx: number;
  cy: number;
}

// ── Public API ───────────────────────────────────────────────────

export function reconstructFromMatches(
  matches: ComponentMatch[],
  imageWidth: number,
  imageHeight: number,
  options: ReconstructionOptions = {},
): ReconstructionResult {
  const canvasW = options.canvasWidth ?? 1200;
  const canvasH = options.canvasHeight ?? 900;
  const ensureSymmetry = options.ensureSymmetry ?? true;
  let id = options.idBase ?? 10000;

  // 1. Map each match to an object spec (image space), assigning real ids.
  const baseSpecs: ObjectSpec[] = matches.map((match) => {
    const box = match.detected.boundingBox ?? {
      x: match.detected.x,
      y: match.detected.y,
      width: match.detected.width,
      height: match.detected.height,
    };
    const type = resolveObjectType(match);
    const obj = buildObject(match, box, type);
    return {
      obj: { ...obj, id: id++ },
      detectedType: match.detected.type,
      cx: box.x + box.width / 2,
      cy: box.y + box.height / 2,
    };
  });

  // 2. Detect / generate mirror symmetry (image space, axis = image center).
  const centerX = imageWidth / 2;
  const { specs, symmetryGroups } = applySymmetry(baseSpecs, centerX, ensureSymmetry, () => id++);

  // 3. Scale to canvas + offset, assign z-index, build hierarchy.
  const scale = Math.min(canvasW / Math.max(1, imageWidth), canvasH / Math.max(1, imageHeight)) * 0.9;
  const offsetX = (canvasW - imageWidth * scale) / 2;
  const offsetY = (canvasH - imageHeight * scale) / 2;

  const placed = specs.map((spec) => {
    const b = spec.obj;
    return {
      ...spec,
      obj: {
        ...b,
        x: (b.x as number) * scale + offsetX,
        y: (b.y as number) * scale + offsetY,
        width: (b.width as number) * scale,
        height: (b.height as number) * scale,
        zIndex: Z_INDEX[spec.detectedType] ?? 50,
        children: [] as number[],
      },
    };
  });

  const parents = assignParents(placed);
  for (const p of placed) {
    const parentId = parents.get(p.obj.id);
    if (parentId !== undefined) p.obj.parentId = parentId;
  }
  for (const p of placed) {
    const pid = p.obj.parentId;
    if (pid !== undefined) {
      const parent = placed.find((q) => q.obj.id === pid);
      if (parent) parent.obj.children!.push(p.obj.id);
    }
  }

  const objects = placed.map((p) => p.obj).sort((a, b) => a.zIndex - b.zIndex);
  const dna = generateDna(matches, objects, options.baseDna);

  return {
    objects,
    dna,
    hierarchy: buildHierarchy(objects),
    symmetryGroups,
    centerX: centerX * scale + offsetX,
    symmetryAxisCount: symmetryGroups.length,
  };
}

// ── Symmetry ─────────────────────────────────────────────────────

function applySymmetry(
  specs: ObjectSpec[],
  axisX: number,
  ensure: boolean,
  allocId: () => number,
): { specs: ObjectSpec[]; symmetryGroups: SymmetryGroup[] } {
  const groups: SymmetryGroup[] = [];
  const used = new Set<number>();
  const result: ObjectSpec[] = [...specs];
  const tolX = Math.max(6, specs.length * 2);
  const tolY = 8;

  // Detect mirrored pairs of the same detected type at similar height.
  for (let i = 0; i < specs.length; i++) {
    if (used.has(i)) continue;
    for (let j = i + 1; j < specs.length; j++) {
      if (used.has(j)) continue;
      const a = specs[i]!;
      const b = specs[j]!;
      if (a.detectedType !== b.detectedType) continue;
      if (Math.abs(a.cy - b.cy) > tolY) continue;
      if (Math.abs(a.cx + b.cx - 2 * axisX) > tolX) continue;
      used.add(i);
      used.add(j);
      groups.push({
        id: `sym-${a.detectedType}-${groups.length}`,
        type: a.obj.type,
        leftObjectId: a.cx <= b.cx ? a.obj.id : b.obj.id,
        rightObjectId: a.cx <= b.cx ? b.obj.id : a.obj.id,
        axisX,
        generated: false,
      });
      break;
    }
  }

  // For unpaired off-center components, generate the mirrored partner.
  if (ensure) {
    for (let i = 0; i < specs.length; i++) {
      if (used.has(i)) continue;
      const a = specs[i]!;
      if (Math.abs(a.cx - axisX) <= tolX) continue; // already centered
      const mirrorId = allocId();
      const mirrored: ObjectSpec = {
        obj: {
          ...a.obj,
          id: mirrorId,
          name: `${a.obj.name} (Mirror)`,
          x: 2 * axisX - (a.obj.x + (a.obj.width as number)),
          flipX: true,
          metadata: {
            ...a.obj.metadata,
            symmetry: { group: `sym-${a.detectedType}-${groups.length}`, side: "right" },
          },
        },
        detectedType: a.detectedType,
        cx: 2 * axisX - a.cx,
        cy: a.cy,
      };
      used.add(i);
      result.push(mirrored);
      groups.push({
        id: `sym-${a.detectedType}-${groups.length}`,
        type: a.obj.type,
        leftObjectId: a.obj.id,
        rightObjectId: mirrorId,
        axisX,
        generated: true,
      });
    }
  }

  return { specs: result, symmetryGroups: groups };
}

// ── Object building ──────────────────────────────────────────────

function buildObject(
  match: ComponentMatch,
  box: { x: number; y: number; width: number; height: number },
  type: ObjectType,
): BaseObjectData {
  const def = match.primary;
  const paramDefaults = defaultsFromDef(def);
  const draft = match.draft;
  return {
    id: 0, // assigned later
    type,
    category: "ganpati",
    name: match.primary.label,
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    flipX: false,
    flipY: false,
    opacity: 1,
    fill: (draft?.suggested.fill as string) || def.defaultFill || match.detected.color || "#334155",
    stroke: (draft?.suggested.stroke as string) || def.defaultStroke || "#475569",
    strokeWidth: 2,
    visible: true,
    locked: false,
    zIndex: 0,
    children: [],
    metadata: {
      ...paramDefaults,
      vision: {
        detectedType: match.detected.type,
        confidence: match.confidence,
        matchedLabel: def.label,
        isDraft: match.isDraft,
        draftLabel: draft?.label ?? null,
      },
      symmetry: { group: null, side: "none" },
    },
    materialThickness: 25,
  };
}

function defaultsFromDef(def: ComponentDef): Record<string, any> {
  const out: Record<string, any> = {};
  for (const p of def.params) {
    out[p.key] = p.default;
  }
  return out;
}

function resolveObjectType(match: ComponentMatch): ObjectType {
  const t = match.primary.type;
  if (VALID_OBJECT_TYPES.has(t)) return t;
  return DETECTED_TO_OBJECT[match.detected.type] ?? "rectangle";
}

// ── Hierarchy ────────────────────────────────────────────────────

function assignParents(placed: ObjectSpec[]): Map<number, number> {
  const parents = new Map<number, number>();
  for (const child of placed) {
    // Every object (including containers like stage/arch) can be a child of a
    // larger container that fully encloses it. Parents are always containers.
    let best: ObjectSpec | null = null;
    let bestArea = Infinity;
    for (const cand of placed) {
      if (cand.obj.id === child.obj.id) continue;
      if (!CONTAINER_TYPES.has(cand.detectedType)) continue;
      if (contains(cand.obj, child.obj)) {
        const area = (cand.obj.width as number) * (cand.obj.height as number);
        if (area < bestArea) {
          bestArea = area;
          best = cand;
        }
      }
    }
    if (best) parents.set(child.obj.id, best.obj.id);
  }
  return parents;
}

function contains(outer: BaseObjectData, inner: BaseObjectData): boolean {
  const inset = 1;
  return (
    (outer.x as number) + inset <= (inner.x as number) &&
    (outer.y as number) + inset <= (inner.y as number) &&
    (outer.x as number) + (outer.width as number) - inset >= (inner.x as number) + (inner.width as number) &&
    (outer.y as number) + (outer.height as number) - inset >= (inner.y as number) + (inner.height as number)
  );
}

function buildHierarchy(objects: BaseObjectData[]): HierarchyNode[] {
  const nodes = new Map<number, HierarchyNode>();
  for (const o of objects) {
    nodes.set(o.id, { id: o.id, type: o.type, label: o.name, parentId: o.parentId ?? null, children: [] });
  }
  const roots: HierarchyNode[] = [];
  for (const o of objects) {
    const node = nodes.get(o.id)!;
    const pid = o.parentId;
    const parent = pid !== undefined ? nodes.get(pid) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

// ── DNA ──────────────────────────────────────────────────────────

function generateDna(
  matches: ComponentMatch[],
  objects: BaseObjectData[],
  base?: DesignDNA,
): DesignDNA {
  const types = new Set(matches.map((m) => m.detected.type));
  const colors = collectColors(matches);
  const baseDna = base ?? DEFAULT_DNA;

  let style: DesignDNA["style"] = "traditional";
  if (types.has("peacock") && (types.has("prabhavali") || types.has("om"))) style = "royal";
  else if (types.has("prabhavali") || types.has("om")) style = "temple";
  else if (types.size <= 2) style = "minimal";

  const complexity = clamp(Math.min(5, objects.length), 1, 5) as 1 | 2 | 3 | 4 | 5;

  return {
    ...baseDna,
    style,
    complexity,
    symmetry: "mirror",
    proportions: "standard",
    primaryColor: colors[0] ?? baseDna.primaryColor,
    secondaryColor: colors[1] ?? baseDna.secondaryColor,
    accentColor: colors[2] ?? baseDna.accentColor,
    frame: types.has("frame") || types.has("border") ? (baseDna.frame ?? "lotus-frame") : "none",
    arch: types.has("arch") ? (baseDna.arch ?? "pointed") : "none",
    pillar: types.has("pillar") ? (baseDna.pillar ?? "classic") : "none",
    stage: types.has("stage") ? (baseDna.stage ?? "3-tier") : "none",
    lotus: types.has("lotus") ? (baseDna.lotus ?? "8-petal") : "none",
    peacock: types.has("peacock") ? (baseDna.peacock ?? "central") : "none",
    background: types.has("background") ? (baseDna.background ?? "panel") : "none",
  };
}

/** Collect up to 3 distinct, non-gray dominant colors from detected components. */
function collectColors(matches: ComponentMatch[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of matches) {
    const c = m.detected.color;
    if (!c || seen.has(c)) continue;
    if (isGray(c)) continue;
    seen.add(c);
    out.push(c);
    if (out.length >= 3) break;
  }
  return out;
}

function isGray(hex: string): boolean {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return false;
  const r = parseInt(m[1]!, 16);
  const g = parseInt(m[2]!, 16);
  const b = parseInt(m[3]!, 16);
  return Math.max(r, g, b) - Math.min(r, g, b) < 24;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
