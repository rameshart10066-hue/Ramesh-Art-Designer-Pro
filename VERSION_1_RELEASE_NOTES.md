# Ramesh Art Designer Pro — Version 1.0 Release Notes

**Release Date:** July 29, 2026
**Version:** 1.0.0

---

## Overview

Ramesh Art Designer Pro is a professional vector design application specialized for Ganpati decoration, thermocol cutting, CNC routing, and laser cutting. Unlike general-purpose vector editors, it provides parametric CAD components for traditional Indian ceremonial design and a complete manufacturing production pipeline.

## What's New in 1.0

### Canvas & Editing
- Canvas2D rendering engine with 60 FPS performance
- Professional drawing tools: rectangle, circle, ellipse, star, polygon, line, text, pan
- Full object selection with multi-select, rubber-band selection
- Move, resize (8 handles), rotate with Shift/Alt modifiers
- Smart snapping: object alignment, canvas edges, grid

### Ganpati CAD Engine (Flagship Feature)
- 30+ parametric components across 17 categories
- Components: Frames, Mandaps, Arches, Pillars, Domes, Lotus, Peacock, Kalash, Bells, Prabhavali, Backgrounds, Borders, Decorative, Stage, Temple, Lighting, Custom
- Every component has editable parameters (e.g., Mandap: pillar count, arch height, roof style, ornament density)
- All components render via Canvas2D with polymorphic BaseCanvasObject architecture

### Professional Editing
- Undo/Redo with command-pattern batching
- Object alignment: left, right, top, bottom, center H/V
- Distribution: horizontal and vertical
- Z-order: bring forward, send backward, bring to front, send to back
- Transform: flip horizontal/vertical, rotate 90°/-90°
- Group/ungroup with nested group support

### Component Library
- Categorized library with 17 categories + favorites + recent
- Instant search by name, tags, or description
- Drag-and-drop from library to canvas
- Favorites persisted in localStorage

### Manufacturing Production Engine
- Auto-nesting: MAXRECTS bin-packing with rotation, gap, margin
- Material estimator: cost, waste, machine time, labor time, production cost
- Part manager: auto-generates part numbers with area, perimeter, weight, cut length
- Cut order optimizer: priority sorting by action type
- Color-to-toolpath mapping: 6 colors → cut, score, engrave, mark, drill
- Multi-sheet support with visual sheet preview
- Reports: Production, Material, Part, Cost

### Export
- SVG export per sheet
- DXF export for CAD compatibility
- Laser G-code (.nc) for Ruida/LightBurn controllers
- Cut-ready SVG with color-coded layers

### User Interface
- Professional workspace layout (menu bar, toolbar, status bar)
- File menu: New, Open, Save, Save As (.radp), Export
- Edit menu: Undo, Redo, Cut, Copy, Paste, Duplicate, Delete, Select All
- View menu: Grid, Guides, Snap controls
- Tabbed right panel: Properties, Layers, Manufacturing, Align, Export
- Status bar: selection info, zoom, snap status

### File Format
- `.radp` project format: full project serialization
- Canvas state, objects, manufacturing data, settings, metadata
- Version tracking
- Autosave with 1-minute interval
- Crash recovery with backup rotation

## Known Limitations

See [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) for details.

Key items:
- WebGL not yet used (500+ object limit before FPS drops)
- G-code is simplified for common machines
- DXF export is basic
- No mobile/tablet optimized UI
- No cloud save

## Installation

```bash
npm install
npm run dev    # Development
npm run build  # Production build
npm run start  # Production server
```

## Technical Stack

- **Framework:** Next.js 15 (App Router)
- **Rendering:** Canvas2D
- **Language:** TypeScript (strict mode)
- **State:** Zustand
- **Build:** Turbopack (dev), webpack (prod)

## License

Proprietary — All rights reserved.
