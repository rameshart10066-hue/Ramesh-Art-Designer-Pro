# Performance Guide

## Rendering Architecture

Ramesh Art Designer Pro uses **Canvas2D** for all rendering. No HTML elements are used for canvas objects.

### Current Performance Characteristics

| Scenario | Performance | Notes |
|---|---|---|
| 10-50 objects | 60 FPS | Normal editing workload |
| 50-200 objects | 60 FPS | Basic shapes, no shadows |
| 200-500 objects | 30-60 FPS | Depends on complexity |
| 500-2000 objects | 15-30 FPS | Needs optimization |
| 2000+ objects | < 15 FPS | Virtual viewport needed |

### Why Canvas2D (not DOM)

- **No layout thrashing**: Canvas2D avoids the browser's layout/paint cycle
- **Single composite layer**: One canvas element instead of N divs
- **Direct pixel control**: Shadows, transforms, compositing in one pass
- **Worker-friendly**: Future offload to OffscreenCanvas

### Optimization Techniques Used

1. **requestAnimationFrame loop**: Continuous render loop; only redraws when `needsRedrawRef` is set
2. **Object cache**: `Map<id, ICanvasObject>` stores wrappers across frames; `update()` avoids re-instantiation
3. **Change detection**: `needsRedrawRef` prevents unnecessary frames
4. **Grid rendering on canvas**: Grid drawn in same pass as objects

### Planned Optimizations

1. **Frustum culling**: Skip drawing objects outside viewport (viewport module exists, not in use)
2. **DPR-aware canvas**: Already implemented with `devicePixelRatio` scaling
3. **Offscreen canvas**: Move grid to separate canvas layer
4. **Change batching**: Batch property updates during drag/resize
5. **LOD (Level of Detail)**: Simplify distant objects

## Snapping Performance

- All snap calculations are O(n) per frame
- Guide deduplication prevents visual clutter
- Snap is disabled during pan/zoom for responsiveness

## Memory

- Object wrappers: ~200 bytes per object
- Path data: ~50 bytes per node
- Undo history: Stores full object snapshots (configurable depth)
