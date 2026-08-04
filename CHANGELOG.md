# Changelog

## Sprint 5.5 — Version 1.0 Architecture (Integration)

### Menu Bar
- **File**: New, Open, Save (.radp), Save As, Import SVG, Export SVG/DXF, Print, Close
- **Edit**: Undo, Redo, Cut, Copy, Paste, Duplicate, Delete, Select All — all wired to stores
- **View**: Show Grid, Show Guides, Snap to Grid, Snap to Objects (toggleable), Reset View, Fullscreen
- **Window**: Reset Layout, Dark Mode
- **Help**: About, Keyboard Shortcuts

### Status Bar
- Selection info ("No selection", "1 object selected", "N objects selected")
- Total object count
- Active tool display
- Grid ON/OFF indicator
- Snap status (Grid/Obj/OFF)
- Zoom percentage (monospace)

### Professional Workspace Layout
```
┌────────────────────────────────────────────────────────────┐
│ Menu Bar                                                   │
├────────────────────────────────────────────────────────────┤
│ Toolbar                                                    │
├──────────┬──────────────────────────────┬──────────────────┤
│ Library  │                              │ Properties       │
│ (280px)  │        CANVAS                │ Layers           │
│          │                              │ Manufacturing    │
│          │                              │ Align            │
│          │                              │ Export           │
├──────────┴──────────────────────────────┴──────────────────┤
│ Status Bar                                                 │
└────────────────────────────────────────────────────────────┘
```
- Left panel: Component Library (280px, resizable)
- Center: Canvas (flex)
- Right panel: Tabbed (320px) — Properties, Layers, Manufacturing, Align, Export
- All panels docked — no floating windows
- Dark theme throughout

### Project File (.radp)
- Full save/load with JSON format
- Includes: metadata, canvas state, objects, manufacturing data, settings, assets
- Version tracking (project v1.0, app v1.0.0)

### Autosave & Recovery
- 1-minute autosave interval to localStorage
- Crash recovery on next load
- Backup rotation (keeps last 5)
- Automatic backup cleanup when storage is full

### Files Created
- `components/MenuBar.tsx` — Complete menu system with 5 menus
- `components/StatusBar.tsx` — Professional status bar
- `services/projectService.ts` — .radp file format + autosave + recovery + backups
- `VERSION.md` — Version 1.0.0 documentation

### Files Restructured
- `DesignGeneratorStudio.tsx` — Complete professional layout rewrite

## Sprint 5 — Manufacturing Production Engine

- Auto-nesting engine (MAXRECTS bin-packing)
- Part manager with area/weight/time calculations
- Material estimator (cost, waste, machine/labor time)
- Cut order optimizer (priority sorting + travel optimization)
- Color-to-toolpath mapping (6 colors → cut/score/engrave/mark/drill)
- Report generator (5 report types)
- Export manager (SVG, DXF, laser G-code)
- 6-tab manufacturing UI panel

## Sprint 4 — Ganpati CAD Component Engine

- 30+ parametric components across 17 categories
- Component registry with search, favorites, recent
- 5 new rendering objects (Peacock, Bell, Prabhavali, Swastik, Om)
- Manufacturing metadata in data model

## Sprint 3 — Professional Editing Engine

- Path system with Bezier handles
- Boolean operations
- Alignment, distribution, arrange, transform
- Group system

## Sprint 2 — Drawing Tools

- 9-tool palette with keyboard shortcuts
- Click-and-drag shape creation
- Rubber-band preview

## Sprint 1 — Canvas Consolidation

- Single store (editorStoreV2)
- Canvas2D rendering with BaseCanvasObject
- Selection, move, resize, rotate with snapping
- Panel system connected
- 15+ dead files removed
