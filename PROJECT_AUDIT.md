# Ramesh Art Designer Pro — Project Audit

> Generated: 2026-07-29
> Goal: Professional desktop-grade vector design application specialized for Ganpati decoration, thermocol cutting, CNC routing, and laser cutting.
> Stack: Next.js 15 (App Router) + TypeScript + Zustand + npm workspaces monorepo

---

## Current Completion: ~35%

---

## 1. Architecture Overview

### Monorepo Packages

| Package | Status | Purpose |
|---|---|---|
| `apps/web` | 🟡 Partial | Next.js app (UI + API routes) |
| `packages/design-engine` | 🟢 Complete | Parametric design generation (nameplates, boxes, nesting) |
| `packages/manufacturing-engine` | 🟢 Complete | DXF export, material profiles, nesting, part numbering |
| `packages/ai-engine` | 🟠 Stub | Claude API wrapper (just a barrel export) |
| `packages/api-contracts` | 🟢 Complete | Shared TypeScript types between frontend and API |
| `packages/database` | 🟢 Complete | Prisma schema + client |

### App Structure

```
apps/web/src/
├── app/              # Next.js pages + API routes (27 routes)
├── components/       # Reusable canvas UI components
├── hooks/            # React hooks (editor, canvas engine, viewport)
├── lib/              # Pure logic (canvas-engine, auth, catalog, etc.)
├── modules/          # Feature modules (dashboard, design-generator, etc.)
├── objects/          # Polymorphic canvas object system
├── services/         # Service layer (editor tools, API wrappers)
├── stores/           # Zustand stores (3 overlapping stores)
└── types/            # TypeScript definitions
```

---

## 2. Module-by-Module Analysis

### Canvas Engine (`lib/canvas-engine/`) — 🟢 90% Complete

**Working:**
- Viewport transforms (screen ↔ world coordinate conversion)
- Zoom towards point (mouse-wheel pivot)
- Fit-to-viewport, center-on-point, viewport clamping, frustum culling
- Dynamic grid generation with adaptive sizing
- Grid line/subdivision rendering (major/minor)
- Snap-to-grid helper
- Full object-to-object snapping (6 alignments per pair)
- Canvas edge & center snapping
- Snap result with guide deduplication
- 8-resize-corner computation (with shift-proportion & alt-from-center)
- Rotation angle computation
- Drag delta computation
- Interaction state machine (pan, select, drag, resize, rotate)
- Selection rectangle math (normalize, intersect, union, rotated bounds)
- All 8 resize handle positions + rotation handle position

**Missing:**
- No unit tests
- No keyboard interaction integration
- No touch/gesture support

### Object System (`objects/`) — 🟡 65% Complete

**Working:**
- `BaseCanvasObject` abstract class with transforms, styles, SVG helpers
- `RectangleObject`, `CircleObject`, `EllipseObject`, `StarObject`
- `LotusObject` (multi-petal with configurable layers)
- `MandapObject` (temple structure with pillars, arch types)
- `KalashObject` (sacred pot with neck, mango leaves)
- `PillarObject` (decorative column with sections)
- `ArchObject` (multi-layer decorative arch)
- `DomeObject` (rounded/pointed/onion dome with finial)
- `BasePlatformObject` (multi-tier pedestal)
- `ObjectFactory` (registry pattern, no switch statements)
- SVG export for all objects
- Hit testing, serialization, duplication

**Missing:**
- ❌ **None of these objects are used in the canvas components** — they exist as a standalone library but `CanvasV2` and `CanvasPro` render plain `<div>` elements
- No Canvas2D rendering integration into the canvas components
- No `TextObject`, `ImageObject`, `SVGObject`, `PolygonObject` implementations (types exist)
- No group/ungroup support (children IDs tracked but never used)
- No path/pen tool objects
- No gradient or pattern fill support
- No clipping/masking

### Selection System — 🟡 50% Complete

**Working:**
- `SelectionManager` class (basic single/toggle selection)
- `selectionService` (selectMultiple, selectAll, clearSelection, etc.)
- Rubber-band multi-select in CanvasPro
- Shift-click multi-select in CanvasPro
- `SelectionBox` component (dashed selection rectangle)

**Missing:**
- ❌ No lasso selection
- ❌ No selection group bounding box
- ❌ No alignment tools (distribute, align left/right/center)
- Selection is spread across 3 stores — not unified

### Transform Tools — 🟡 45% Complete

**Working:**
- Drag to move (via CanvasV2 and CanvasPro)
- 8-handle resize (via CanvasV2 and CanvasPro)
- Rotation via green handle (via CanvasV2 and CanvasPro)
- Shift-constrain proportions during resize (CanvasPro)
- Alt-resize from center (CanvasPro)
- Snap-while-drag (object-snap, canvas-snap, grid-snap in CanvasPro)
- `DragManager`, `ResizeManager`, `RotateManager` classes exist but unused

**Missing:**
- ❌ No scale tool
- ❌ No skew/shear
- ❌ No free transform
- ❌ No nudge with arrow keys integrated into canvas (GlobalKeyboardShortcuts has it but uses editorStoreV2, not connected to active canvas)
- No transform origin point editing

### Drawing Tools — 🔴 0% Complete

**Missing:**
- ❌ No pen/path tool
- ❌ No freehand drawing tool
- ❌ No line tool
- ❌ No shape creation via click-and-drag
- ❌ No boolean operations (union, subtract, intersect)
- ❌ No knife/scissors tool
- Objects are added by clicking in ComponentLibrary (placed at random position)

### Text Engine — 🔴 5% Complete

**Working:**
- `TextObjectData` type defined
- Text properties in `PropertiesPanelV2` (fontSize, fontFamily, fontWeight, textAlign, lineHeight)
- `CanvasItem` type includes text properties

**Missing:**
- ❌ No text rendering on canvas objects (items show their `name` as a label, not actual text content)
- ❌ No in-canvas text editing
- ❌ No rich text support
- ❌ No text-on-path
- ❌ No font loading/management
- ❌ Character/paragraph panels

### Layer Manager — 🟡 70% Complete

**Working:**
- `LayersPanel` component with full UI
- Layer reordering via drag-and-drop (zIndex swap)
- Layer rename (double-click inline edit)
- Lock/unlock toggle
- Visibility toggle
- Delete from layer panel
- Multi-select in layers
- zIndex-based sorting

**Missing:**
- ❌ No layer groups/folders
- ❌ No layer effects (blend modes)
- ❌ No layer search/filter
- No layer duplication from panel
- Limited visual thumbnails (just emoji icons)

### Property Panel — 🟡 60% Complete

**Working:**
- `PropertiesPanelV2` (full-featured, used in studio)
- Position (X, Y) with px suffix
- Size (W, H) with min constraint
- Rotation (degrees)
- Opacity (percentage slider)
- Fill color (color picker + hex input)
- Stroke color + width
- Corner radius
- Shadow (blur, offset X/Y, color)
- Text properties (fontSize, fontFamily, fontWeight, textAlign, lineHeight)
- Image filters (brightness, contrast, saturation, blur)
- Proper section grouping with labels

**Duplicates:**
- `PropertyPanel.tsx` and `PropertiesPanel.tsx` are simpler versions — unused

**Missing:**
- ❌ No gradient editor
- ❌ No transform panel (scale X/Y, rotation origin)
- ❌ No geometry panel (path editing)
- ❌ No SVG filter effects
- ❌ No CSS-like style cascade

### Component Library — 🟡 60% Complete

**Working:**
- `ComponentLibrary` sidebar with categorized items
- Drag-to-canvas (drop event in CanvasV2)
- Click-to-add (places at random position)
- 3 categories: Basic Shapes, Decoration, Graphics
- Emoji icons for each component type
- Type-to-shape mapping

**Missing:**
- ❌ No search/filter
- ❌ No custom component saving
- ❌ No recent/favorites section
- ❌ No drag preview ghost
- Placeholder fallback for unsupported types
- Icons are emoji-based, not SVG thumbnails

### Template Library — 🔴 0% Complete

**Missing:**
- ❌ No template system exists at all
- ❌ No save-as-template
- ❌ No template gallery
- ❌ No category-based template browsing

### Undo/Redo — 🟡 55% Complete

**Working (V2 - Command Pattern):**
- `commandHistoryService` with full command pattern
- Undo/redo stack with batch mode
- Command factories: move, resize, rotate, delete, add, duplicate, zIndex, property
- Batched undo for drag/resize/rotate operations
- Proper reverse execution order for batch undo
- `editorStoreV2` uses command history consistently

**Legacy (not used):**
- `HistoryManager` class (canvasStore) — snapshot-based, simpler
- `historyService` (editorStore) — snapshot-based, incomplete

**Missing:**
- ❌ No undo/redo UI (buttons in toolbar)
- ❌ No history panel (timeline view)
- No keyboard shortcut for redo in CanvasV2 (only Ctrl+Z, no Ctrl+Shift+Z)
- History is not persisted

### File System — 🔴 0% Complete

**Missing:**
- ❌ No project file (.rdesign) format defined
- ❌ No save/load from disk
- ❌ No recent files list
- ❌ No auto-save
- ❌ No file recovery

### Import — 🔴 10% Complete

**Working:**
- SVG generation API route exists
- `toSVG()` method on all canvas objects

**Missing:**
- ❌ No SVG file import/parsing
- ❌ No DXF import
- ❌ No PDF import
- ❌ No AI/EPS import
- ❌ No image import (PNG, JPEG)
- Import SVG button in studio is non-functional

### Export — 🟡 25% Complete

**Working:**
- SVG export per-object (via `toSVG()`)
- DXF generator in `manufacturing-engine` (data layer only)
- Export SVG in studio (non-functional button)
- Export DXF in studio (non-functional button)
- PNG export button (non-functional)

**Missing:**
- ❌ No actual file download from UI
- ❌ No multi-page/artboard export
- ❌ No PDF export
- ❌ No batch export
- Export buttons in DesignGeneratorStudio do nothing (no onClick handlers)

### Print — 🔴 0% Complete

**Missing:**
- ❌ No print dialog integration
- ❌ No print scaling/preview
- ❌ No tiled printing for large designs
- ❌ No bleed/mark settings

### Laser/CNC Module — 🟡 50% Complete

**Working (in `packages/manufacturing-engine`):**
- Material profiles with cutting parameters
- Part numbering system
- Nesting algorithm
- DXF generator
- Manufacturing SVG generator
- API routes for all manufacturing operations

**Working (in `apps/web`):**
- Manufacturing studio with material selection, nesting panel, output preview
- Nesting page with optimization panel, statistics
- Part numbering page
- Assembly guide (step-by-step with timeline, checklist)

**Missing:**
- ❌ No toolpath generation from canvas objects
- ❌ No kerf compensation
- ❌ No laser power/speed visualization
- ❌ No CNC g-code export
- ❌ No machine profile management (beyond material profiles)
- No cut order optimization visualization
- No waste calculation

### Keyboard Shortcuts — 🟡 50% Complete

**Working:**
- `GlobalKeyboardShortcuts` component (editorStoreV2):
  - Ctrl+Z/Y undo/redo
  - Ctrl+C/X/V copy/cut/paste
  - Ctrl+A select all
  - Ctrl+D duplicate
  - Delete/Backspace delete selected
  - Escape clear selection
  - Space for pan mode
  - Arrow keys to nudge (1px, 10px with Shift)
  - Ctrl+Wheel zoom (limited to editorStoreV2)

**Working (simple):**
- `KeyboardShortcuts` module (CanvasV2):
  - Ctrl+Z undo
  - Ctrl+Y redo
  - Ctrl+D duplicate
  - Delete delete selected

**Missing:**
- ❌ No shortcut customization UI
- ❌ `KeyboardShortcutsPanel` is a help modal but not connected to actual shortcuts
- EditorStoreV2's zoom is clamped to 0.1-5, but canvas engine supports 0.1-8
- Some shortcuts don't check for input element focus
- No toolbar tooltips showing shortcuts

### Performance — 🔴 10% Complete

**Working:**
- `useMemo` on sorted objects
- `ResizeObserver` for container sizing
- Canvas rendering for grid (offloads to <canvas>)
- Frustum culling in viewport module (not used by any canvas)

**Missing:**
- ❌ No canvas-based object rendering (all objects are DOM divs — won't scale beyond ~200 items)
- ❌ No virtual viewport (all objects rendered regardless of visibility)
- ❌ No worker threads for heavy computation
- ❌ No object pooling
- ❌ No memoization on property panel inputs
- DPR-aware canvas exists in Rulers.js but not in grid overlay (CanvasPro uses a separate implementation)
- No lazy loading
- No chunked rendering

### Settings — 🟡 15% Complete

**Working:**
- Grid toggle (showGrid)
- Grid snap toggle (snapToGrid)
- Object snap toggle (snapToObjects)
- Guide toggle (showGuides)
- Grid size setting
- Snap tolerance setting
- All persisted in editorStore/editorStoreV2

**Missing:**
- ❌ No settings UI/panel
- ❌ No user preferences persistence
- ❌ No theme switching
- ❌ No unit system (mm, inches, px)
- ❌ No grid subdivision configuration in UI
- Default canvas units are pixels — no physical unit conversion

### Plugin Architecture — 🔴 0% Complete

**Missing:**
- ❌ No plugin system exists
- ❌ No extension API
- ❌ No custom tool registration
- ❌ No script runner

---

## 3. Duplicate Code & Consolidation Needed

### Critical Duplications

| Area | Files | Issue |
|---|---|---|
| **Canvas** | `Canvas.tsx`, `CanvasV2.tsx`, `CanvasPro.tsx`, `InfiniteCanvas.tsx` | 4 different canvas implementations with overlapping features. CanvasV2 is used in DesignStudio but CanvasPro is more feature-complete. InfiniteCanvas is a wrapper component that's not used. |
| **Property Panel** | `PropertyPanel.tsx`, `PropertiesPanel.tsx`, `PropertiesPanelV2.tsx` | 3 panels. Only V2 is used in the studio. The other 2 are dead code. |
| **Editor Store** | `canvasStore.ts`, `editorStore.ts`, `editorStoreV2.ts` | 3 stores with overlapping state. `canvasStore` is used by CanvasV2. `editorStoreV2` is used by CanvasPro. `editorStore` is used by legacy hooks. |
| **Editor Hooks** | `useEditor.ts`, `useEditorV2.ts` | Nearly identical — same function names, different store imports |
| **History** | `HistoryManager.ts`, `historyService.ts`, `commandHistoryService.ts` | 3 history systems. Only commandHistoryService is complete. |
| **Snapping** | `snappingService.ts`, `canvas-engine/snapping.ts`, `alignmentService.ts` | 3 snapping implementations with overlapping logic |
| **Keyboard Shortcuts** | `KeyboardShortcuts.ts`, `GlobalKeyboardShortcuts.tsx` | 2 implementations, different store backends |
| **Resize/Rotate** | `ResizeManager.ts`, `RotateManager.ts`, `DragManager.ts` | Class-based managers that are unused — logic is inline in CanvasV2/CanvasPro |
| **Resize Handles** | Inline in `CanvasPro.tsx` (lines 76-113) + `ResizeHandles.tsx` | Duplicated handle rendering logic |

### Dead Code (Likely Unused)
- `PropertyPanel.tsx` — superseded by PropertiesPanelV2
- `PropertiesPanel.tsx` — superseded by PropertiesPanelV2
- `Canvas.tsx` — prototype, superseded by CanvasV2
- `InfiniteCanvas.tsx` — not imported anywhere (may be pending)
- `DragManager.ts` — unused class
- `ResizeManager.ts` — unused class
- `RotateManager.ts` — unused class
- `SelectionManager.ts` — unused class
- `SelectionBox.tsx` — unused (selection rect is inline in CanvasPro)
- `historyService.ts` — superseded by commandHistoryService
- `HistoryManager.ts` — only used by canvasStore
- `snappingService.ts` — superseded by canvas-engine/snapping.ts + alignmentService
- `ProjectContext.tsx` — exists alongside projectStore (Zustand)
- `useEditor.ts` — superseded by useEditorV2.ts

---

## 4. Broken Items

### TypeScript Errors (now fixed, previously broken)
- `useCanvasEngine.ts` — Interface/function signature mismatch ✅ Fixed
- `canvas-engine/index.ts` — AlignmentPoints re-export from wrong module ✅ Fixed
- `objects/shapes/index.ts` + `objects/ganpati/index.ts` — `exactOptionalPropertyTypes` violation with `id: undefined` ✅ Fixed
- `CanvasPro.tsx` — `pointInRect` call with wrong arguments ✅ Fixed

### Logic Bugs Still Present
1. **DesignGeneratorStudio.tsx:59-61** — `estimate.price`, `estimate.sheets`, `estimate.cuttingTime` used in `handleGenerate` before the `estimate` useMemo computes them. The `handleGenerate` function references `estimate` which is a `useMemo` that runs synchronously in the render cycle — however, it's called outside of the `useMemo`: `updateProject({..., estimatedCost: estimate.price, ...})`. Since `estimate` is a useMemo result that depends on state, this should work because React guarantees the useMemo runs before event handlers. However, the `updateProject` in `handleGenerate` writes values that aren't yet computed at render time — actually wait, `estimate` IS computed in the same render. This is fine — it works because useMemo runs before the event handler. But it's still fragile since `estimate` is a render-time value used inside an async function.

2. **CanvasV2 interaction ref** — Doesn't handle pointer capture, can lose tracking if pointer leaves canvas

3. **CanvasPro**: Zoom indicator doesn't account for ruler offset (20px) when rulers are visible

4. **GlobalKeyboardShortcuts** uses editorStoreV2 but the DesignGeneratorStudio uses CanvasV2 which uses canvasStore — shortcuts won't affect active canvas objects

5. **ComponentLibrary** — Adding from library uses `Math.random()` for position — poor UX

6. **PropertiesPanelV2** — Calls `saveHistory()` on every keystroke during input, which creates undo entries for partial edits

---

## 5. Missing Features Summary

| Feature | Priority | Status | Effort |
|---|---|---|---|
| Canvas unification (use CanvasPro everywhere) | 🔴 Critical | ❌ Missing | 2 days |
| Store consolidation (eliminate canvasStore, editorStore) | 🔴 Critical | ❌ Missing | 3 days |
| Render objects via Canvas2D (not DOM divs) | 🔴 Critical | ❌ Missing | 5 days |
| Connect Object System to canvas rendering | 🔴 Critical | ❌ Missing | 3 days |
| Text rendering + in-canvas editing | 🟡 High | ❌ Missing | 5 days |
| Pen/Path drawing tool | 🟡 High | ❌ Missing | 5 days |
| SVG file import | 🟡 High | ❌ Missing | 3 days |
| SVG/PNG/DXF export from UI | 🟡 High | ❌ Missing | 2 days |
| Undo/Redo UI + history panel | 🟡 High | ❌ Missing | 2 days |
| Align/distribute tools | 🟡 High | ❌ Missing | 1 day |
| Group/ungroup objects | 🟡 High | ❌ Missing | 2 days |
| Color palette/swatches | 🟡 High | ❌ Missing | 1 day |
| Gradient support | 🟡 High | ❌ Missing | 1 day |
| Snap toggles UI | 🟡 High | ❌ Missing | 1 day |
| File save/load (.rdesign) | 🟡 High | ❌ Missing | 5 days |
| Performance: virtual viewport | 🟡 High | ❌ Missing | 3 days |
| Settings/Preferences UI | 🟡 High | ❌ Missing | 2 days |
| Template system | 🟢 Medium | ❌ Missing | 5 days |
| Lasso selection | 🟢 Medium | ❌ Missing | 1 day |
| Scale/shear/skew tools | 🟢 Medium | ❌ Missing | 2 days |
| Freehand drawing | 🟢 Medium | ❌ Missing | 3 days |
| Boolean shape operations | 🟢 Medium | ❌ Missing | 3 days |
| Image import (raster) | 🟢 Medium | ❌ Missing | 1 day |
| Print functionality | 🟢 Medium | ❌ Missing | 2 days |
| Toolpath generation | 🟢 Medium | ❌ Missing | 5 days |
| G-code/CNC export | 🟢 Medium | ❌ Missing | 3 days |
| Plugin architecture | 🔵 Low | ❌ Missing | 10 days |
| AI-powered design assist | 🔵 Low | 🔴 Stub | 5 days |
| Collaboration/review | 🔵 Low | ❌ Missing | 10 days |
| Mobile/touch support | 🔵 Low | ❌ Missing | 3 days |

---

## 6. Recommended Implementation Order

### Phase 1: Foundation (2-3 weeks)
**Goal: Unified, stable canvas with basic editing working end-to-end**

1. **Consolidate stores** — Keep `editorStoreV2`, delete `canvasStore` and `editorStore`. Migrate `CanvasV2` → `CanvasPro`.
2. **Replace CanvasV2 with CanvasPro** — CanvasPro has all features (snapping, grid, rubber-band, alignment guides, shift+alt resize). Wire it into DesignGeneratorStudio.
3. **Unify canvas rendering** — Connect the `ObjectFactory` + polymorphic `draw()` methods to CanvasPro. Move from div-based to Canvas2D rendering (or hybrid SVG for crisp text).
4. **Fix export** — Wire export buttons to actual SVG/DXF download.
5. **Clean up dead code** — Remove unused components, services, stores.

### Phase 2: Editing & Tools (2-3 weeks)
**Goal: Professional drawing and editing capabilities**

6. **Drawing tools** — Implement pen/path tool, freehand, shape creation via drag.
7. **Text tool** — In-canvas text editing with font support.
8. **Selection tools** — Lasso select, alignment/distribution, group/ungroup.
9. **Transform tools** — Scale, shear, nudge integration, transform origin.
10. **Properties Panel** — Gradient editor, geometry panel, advanced styling.
11. **Swatches/Color** — Color palette with named colors, recent colors.

### Phase 3: File & Export (1-2 weeks)
**Goal: Complete file workflow**

12. **File format** — Define `.rdesign` format (JSON-based). Save/load from disk.
13. **SVG import** — Parse SVG files into canvas objects.
14. **Image import** — Raster image support with positioning/scaling.
15. **Export pipeline** — SVG, PNG, PDF, DXF export with proper dialogs.
16. **Print** — Print dialog with scaling and tiling options.

### Phase 4: Performance & Polish (1-2 weeks)
**Goal: Professional performance and UX**

17. **Canvas2D rendering** — Replace all div-based object rendering with Canvas2D or WebGL.
18. **Virtual viewport** — Only render visible objects.
19. **Worker threads** — Offload snap computation, path rendering.
20. **Smooth zoom** — Animated zoom transitions.
21. **Keyboard shortcuts UI** — Customizable shortcut editor.

### Phase 5: Manufacturing & Advanced (2-3 weeks)
**Goal: Complete design-to-manufacturing pipeline**

22. **Toolpath generation** — Convert canvas paths to CNC/laser toolpaths.
23. **Kerf compensation** — Auto-adjust for cutting width.
24. **Machine profiles** — Save/select machine configurations.
25. **Templates** — Template system with categories.
26. **Settings UI** — Full preferences panel.
27. **Plugin system** — Basic plugin API.

---

## 7. Estimated Work

| Module | Lines of Code | Status | Est. Remaining |
|---|---|---|---|
| Canvas Engine | ~800 | 90% | 2 days |
| Object System | ~1,100 | 65% | 5 days |
| Selection System | ~300 | 50% | 3 days |
| Transform Tools | ~600 | 45% | 5 days |
| Drawing Tools | 0 | 0% | 10 days |
| Text Engine | ~50 | 5% | 5 days |
| Layer Manager | ~350 | 70% | 2 days |
| Property Panel | ~500 | 60% | 3 days |
| Component Library | ~250 | 60% | 2 days |
| Template Library | 0 | 0% | 5 days |
| Undo/Redo | ~350 | 55% | 3 days |
| File System | 0 | 0% | 5 days |
| Import | ~100 | 10% | 5 days |
| Export | ~200 | 25% | 3 days |
| Print | 0 | 0% | 2 days |
| Laser/CNC Module | ~2,500 | 50% | 10 days |
| Keyboard Shortcuts | ~350 | 50% | 2 days |
| Performance | ~100 | 10% | 5 days |
| Settings | ~50 | 15% | 2 days |
| Plugin Architecture | 0 | 0% | 10 days |
| **Total** | **~7,600** | **~35%** | **~75-90 days** |

---

## 8. Architecture Recommendations

### Critical
1. **Single store** — Consolidate to `editorStoreV2` (it has the best command pattern). Remove `canvasStore` and `editorStore`.
2. **Unified canvas** — CanvasPro is the canonical canvas. Remove Canvas, CanvasV2, and migrate InfiniteCanvas functionality into CanvasPro.
3. **Object system integration** — The polymorphic `BaseCanvasObject` system must be the rendering layer. Stop using DOM divs for objects.
4. **Canvas2D rendering** — Use `<canvas>` for ALL object rendering (not just grid). Keep SVG for export only.
5. **Align store with architecture** — The current DesignGeneratorStudio uses CanvasV2 (canvasStore) but imports GlobalKeyboardShortcuts (editorStoreV2). Fix this mismatch.

### Important
6. **Extract CSS** — Move from inline styles to CSS modules or a proper styling solution. Inline styles hurt maintenance and performance.
7. **Add unit tests** — 0 tests across the entire design studio frontend. The canvas engine is pure functions — easy to test.
8. **Replace `any` types** — Despite the architecture mandate of "no any", many components use `any`.
9. **Standardize project data** — 3 different project types exist (`ProjectStoreShape`, `ProjectSelection`, and inline in DesignGeneratorStudio). Consolidate.
10. **Truly connect canvas engine** — `useCanvasEngine` hook is excellent but only used by CanvasPro. Make it the universal canvas interface.

### Nice-to-have
11. **Keyboard shortcut customization** — Store shortcuts in settings, allow rebinding.
12. **Theming** — Dark theme is the only option. Add light theme.
13. **i18n foundations** — Not critical now, but string extraction would prevent a rewrite later.
14. **Offline support** — Service worker for offline access to saved designs.
