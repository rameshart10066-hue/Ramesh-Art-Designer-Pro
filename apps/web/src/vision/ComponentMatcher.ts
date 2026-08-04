/**
 * Component Matcher — Sprint 10.3
 *
 * Matches detected components (Sprint 10.2) against the design studio's
 * Component Registry (`@/services/editor/componentRegistry`) and returns:
 *   - a primary match (best-fit `ComponentDef`),
 *   - alternative matches,
 *   - a confidence (0–1).
 *
 * Rule: when confidence < 90%, a **Draft Component** is created so the
 * detected geometry is preserved for review / later CAD instead of being
 * silently force-matched. The user can manually replace any match with a
 * different registry component.
 *
 * Pure functions — no DOM, Node-testable.
 */

import {
  COMPONENT_REGISTRY,
  getComponentByType,
  searchComponents,
} from "@/services/editor/componentRegistry";
import type { ComponentDef } from "@/types/components";
import type { DetectedComponent } from "./ComponentDetector";
import type { ComponentType } from "./ObjectClassifier";

/** Matches at or above this confidence are auto-accepted (no draft). */
export const AUTO_ACCEPT_THRESHOLD = 0.9;

/** Which registry `type`s are plausible for each detected type. */
const DETECTION_TO_REGISTRY: Record<ComponentType, string[]> = {
  frame: ["rectangle"],
  border: ["rectangle"],
  background: ["rectangle"],
  arch: ["arch"],
  pillar: ["pillar"],
  stage: ["base-platform"],
  lotus: ["lotus"],
  bell: ["bell"],
  peacock: ["peacock"],
  prabhavali: ["prabhavali"],
  om: ["om-symbol"],
};

/** A proposed component created when the match confidence is too low. */
export interface DraftComponent {
  id: string;
  sourceType: ComponentType;
  label: string;
  detected: DetectedComponent;
  suggested: {
    width: number;
    height: number;
    aspectRatio: number;
    fill: string;
    stroke: string;
  };
  /** Best-effort registry def this draft could be based on (may be null). */
  primaryHint: ComponentDef | null;
}

export interface ComponentMatch {
  detected: DetectedComponent;
  /** Best-fit registry component (best effort even when drafted). */
  primary: ComponentDef;
  /** 0–1. */
  confidence: number;
  /** true when confidence >= AUTO_ACCEPT_THRESHOLD. */
  autoAccept: boolean;
  /** Runner-up registry components for manual replacement. */
  alternatives: ComponentDef[];
  /** Present (non-null) exactly when `isDraft` is true. */
  draft: DraftComponent | null;
  isDraft: boolean;
}

// ── Public API ───────────────────────────────────────────────────

/** Match a single detected component against the registry. */
export function matchComponent(detected: DetectedComponent): ComponentMatch {
  const candidates = registryCandidates(detected)
    .map((def) => ({ def, score: scoreDef(def, detected) }))
    .sort((a, b) => b.score - a.score);

  const best = candidates[0];
  const primary = best ? best.def : fallbackDef(detected);
  const fit = best ? best.score : 0;

  // Blend how sure we are of the detected TYPE with how well the registry
  // geometry fits. Deliberately conservative: a confident detection still
  // drafts if no registry variant is geometrically close.
  const confidence = clamp(0.65 * detected.confidence + 0.35 * fit, 0, 1);
  const autoAccept = confidence >= AUTO_ACCEPT_THRESHOLD;
  const alternatives = candidates.slice(1, 4).map((c) => c.def);
  const draft = autoAccept ? null : createDraftComponent(detected, primary);

  return {
    detected,
    primary,
    confidence: round2(confidence),
    autoAccept,
    alternatives,
    draft,
    isDraft: !autoAccept,
  };
}

/**
 * Match a list of detected components, skipping `background` (the backdrop is
 * highlighted but is not a library component to match).
 */
export function matchComponents(detected: DetectedComponent[]): ComponentMatch[] {
  return detected
    .filter((d) => d.type !== "background")
    .map((d) => matchComponent(d));
}

/**
 * Manually replace a match's primary component (e.g. the user picks an
 * alternative). Resets confidence to 1.0 (explicit user choice) and drops
 * any draft.
 */
export function replaceMatch(match: ComponentMatch, chosen: ComponentDef): ComponentMatch {
  const others = [match.primary, ...match.alternatives, ...(match.draft?.primaryHint ? [match.draft.primaryHint] : [])];
  const alternatives = dedupeByLabel(others).filter((c) => c.label !== chosen.label);
  return {
    ...match,
    primary: chosen,
    confidence: 1,
    autoAccept: true,
    alternatives,
    draft: null,
    isDraft: false,
  };
}

/** Create a draft component from a detection (exported for tests/other UIs). */
export function createDraftComponent(
  detected: DetectedComponent,
  primaryHint: ComponentDef | null,
): DraftComponent {
  const box = detected.boundingBox ?? { x: detected.x, y: detected.y, width: detected.width, height: detected.height };
  return {
    id: `draft-${detected.type}-${detected.segmentId}`,
    sourceType: detected.type,
    label: `Draft ${detected.type}`,
    detected,
    suggested: {
      width: box.width,
      height: box.height,
      aspectRatio: box.width / Math.max(1, box.height),
      fill: detected.color,
      stroke: primaryHint?.defaultStroke ?? "#475569",
    },
    primaryHint,
  };
}

/** Promote a draft to a full `ComponentDef` (usable by later CAD steps). */
export function draftToComponentDef(draft: DraftComponent): ComponentDef {
  return {
    type: draft.sourceType as ComponentDef["type"],
    category: "ganpati",
    label: draft.label,
    icon: "📦",
    description: `Draft ${draft.sourceType} from photo detection (${draft.suggested.width}×${draft.suggested.height} px)`,
    tags: [draft.sourceType, "draft", "photo"],
    defaultWidth: draft.suggested.width,
    defaultHeight: draft.suggested.height,
    defaultFill: draft.suggested.fill,
    defaultStroke: draft.suggested.stroke,
    params: [],
  };
}

// ── Internal helpers ─────────────────────────────────────────────

function registryCandidates(detected: DetectedComponent): ComponentDef[] {
  const byType = (DETECTION_TO_REGISTRY[detected.type] ?? [])
    .map((t) => getComponentByType(t))
    .filter((c): c is ComponentDef => Boolean(c));
  const bySearch = searchComponents(detected.type);
  const byTag = COMPONENT_REGISTRY.filter((c) => c.tags.includes(detected.type));
  return dedupeByLabel([...byType, ...bySearch, ...byTag]);
}

/** 0–1 fit of a registry def's default geometry to the detected box. */
function scoreDef(def: ComponentDef, detected: DetectedComponent): number {
  const aspectDef = def.defaultWidth / Math.max(1, def.defaultHeight);
  const aspectDet = detected.width / Math.max(1, detected.height);
  // Log-ratio distance: 1.0 when aspects match, decaying to 0 at ~6× off.
  const aspectScore = 1 - Math.min(1, Math.abs(Math.log2(aspectDef / aspectDet)) / 2.5);
  const tagScore = def.tags.includes(detected.type)
    ? 1
    : def.tags.some((t) => detected.type.includes(t) || t.includes(detected.type))
      ? 0.5
      : 0;
  return clamp(0.85 * aspectScore + 0.15 * tagScore, 0, 1);
}

function fallbackDef(detected: DetectedComponent): ComponentDef {
  const box = detected.boundingBox ?? { x: detected.x, y: detected.y, width: detected.width, height: detected.height };
  return {
    type: detected.type as ComponentDef["type"],
    category: "ganpati",
    label: detected.type,
    icon: "▭",
    description: `Matched ${detected.type} (best effort)`,
    tags: [detected.type],
    defaultWidth: box.width,
    defaultHeight: box.height,
    defaultFill: detected.color,
    params: [],
  };
}

function dedupeByLabel(list: ComponentDef[]): ComponentDef[] {
  const seen = new Set<string>();
  const out: ComponentDef[] = [];
  for (const c of list) {
    if (seen.has(c.label)) continue;
    seen.add(c.label);
    out.push(c);
  }
  return out;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
