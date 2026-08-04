# Known Limitations — v1.0.0

## Canvas

| Limitation | Impact | Planned Fix |
|---|---|---|
| DOM-based object labels render above canvas | Text legibility in complex designs | Hybrid SVG overlay for text (v1.1) |
| No WebGL acceleration | ~500 object limit before FPS drops | WebGL renderer (v1.2) |
| No pinch-to-zoom on touch devices | Tablet users must use buttons | Touch gesture handler (v1.1) |
| Single-viewport only | No split-screen/layer isolation | Multi-viewport (v1.2) |

## Drawing Tools

| Limitation | Impact | Planned Fix |
|---|---|---|
| No freehand/pen tool | Users must use shape primitives | Pen tool with bezier editing (v1.1) |
| No boolean path operations in canvas | Boolean ops are image-based, not parametric | True path boolean engine (v1.2) |
| No text-on-path | Advanced text layout | Text path binding (v1.2) |

## Manufacturing

| Limitation | Impact | Planned Fix |
|---|---|---|
| Nesting is 1D (strip packing) | Lower sheet efficiency than 2D algorithms | Guillotine/bin-packing improvements (v1.1) |
| G-code is simplified | May need manual tuning for specific machines | Machine profiles (v1.1) |
| No toolpath preview on canvas | Cannot visually verify cut order | Toolpath overlay (v1.1) |
| Single material per project | No multi-material support | Material per part (v1.2) |

## File System

| Limitation | Impact | Planned Fix |
|---|---|---|
| No cloud save | Local only | Cloud sync (v1.2) |
| No concurrent editing | Single user | Collaboration (v2.0) |
| Manual backup only | Requires explicit save | Auto-backup to cloud (v1.1) |

## Import/Export

| Limitation | Impact | Planned Fix |
|---|---|---|
| DXF export is simplified | May not open in all CAD programs | Full DXF compliance (v1.1) |
| No PDF import | Cannot import vector PDFs | PDF parser (v1.2) |
| No AI/EPS support | Adobe formats not supported | Format converters (v1.2) |
| No batch export | Each sheet exported individually | Batch pipeline (v1.1) |

## Performance

| Limitation | Impact | Planned Fix |
|---|---|---|
| ~500 objects at 60 FPS | Large designs may lag | WebGL renderer + spatial indexing (v1.2) |
| Undo stores full snapshots | Memory usage grows with history | Command compression (v1.1) |
| No worker threads | Nesting blocks UI | Web Worker (v1.1) |

## Platform

| Limitation | Impact | Planned Fix |
|---|---|---|
| Desktop browser only | No mobile/tablet optimized UI | Responsive layout (v1.2) |
| Chromium-optimized | Firefox/Safari may have minor rendering differences | Cross-browser testing (v1.1) |
| No PWA/offline mode | Requires internet for initial load | PWA with service worker (v1.1) |
