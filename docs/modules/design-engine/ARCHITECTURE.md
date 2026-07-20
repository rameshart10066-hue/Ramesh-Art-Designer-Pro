# Design Generator Module — Architecture

## Why generators are split into pure-geometry + SVG-rendering functions

Each generator separates "compute the geometry" from "render it as SVG
markup":

| Generator | Pure geometry | SVG rendering |
|---|---|---|
| Nameplate | (simple enough to be one function) | `generateNameplateSvg` |
| Finger-joint box | `computeFingerLayout`, `buildFingerJointPanelOutline` | `generateFingerJointBoxSvg` |
| Nesting | `nestRectangles` | `generateNestingSvg` |

This split exists because geometry correctness (do the fingers interlock?
does the packing avoid overlaps?) is what actually needs thorough testing,
and testing plain data structures (`Point[]`, `Placement[]`) is far
simpler than asserting against SVG string output. All 25 tests in this
package test at the geometry level wherever the generator has one; SVG
generators themselves get lighter smoke tests (does it throw on invalid
input, does it contain the right element count).

## Scope boundary: SVG only

This package deliberately does not produce DXF and does not know about
kerf, machine profiles, or LightBurn-specific metadata. That's
`@ramesh/manufacturing-engine`'s responsibility (see
`docs/modules/manufacturing/`). Manufacturing SVG/DXF generation takes
`CutPath[]`-shaped geometry as input — this package's outline-building
functions (`buildFingerJointPanelOutline`, etc.) produce exactly that
shape, so the two packages compose without either one reimplementing the
other's job.

## Documented simplifications

- **Finger-joint box bottom panel** is a plain flat rectangle, not
  finger-jointed to the walls. A slotted or glued bottom-panel joint is a
  reasonable follow-up, not built here (see the doc comment on
  `buildFingerJointPanelOutline.ts`).
- **Nesting is shelf (row-based) packing**, not an optimal 2D bin-packing
  solver (true 2D bin packing is NP-hard). Deterministic and simple,
  slightly wasteful of sheet space compared to an optimal solver.

## Nesting is shared with manufacturing-engine (post-merge)

`@ramesh/manufacturing-engine`'s `nestForManufacturing` depends on this
package's `nestRectangles` directly rather than maintaining its own copy.
During parallel branch development the two packages temporarily had
duplicate shelf-packing implementations (`feature/manufacturing` was
created before this package's nesting code existed); that duplication was
removed when both branches merged into `develop`. See
`docs/modules/manufacturing/ARCHITECTURE.md` for the manufacturing side of
this.
