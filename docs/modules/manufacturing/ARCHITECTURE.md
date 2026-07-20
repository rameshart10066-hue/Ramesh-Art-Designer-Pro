# Manufacturing Module — Architecture

## Layer-color convention (SVG generator)

`generateManufacturingSvg` uses the stroke/fill color convention LightBurn
(and most laser software) uses to auto-assign operations on import:

- **Red stroke (`#FF0000`), hairline width, no fill** → cut
- **Blue fill (`#0000FF`)** on `<text>` → engrave

This means output from this generator can be dropped straight into
LightBurn without manual layer reassignment, as long as the target
software follows the same convention (most do; it originates from
LightBurn/CorelDraw-era laser workflows).

## Kerf handling — what's real vs. what's simplified

- **Nesting spacing** is genuinely kerf-derived:
  `appliedSpacingMm = materialProfile.kerfMm * 2 + extraSpacingMm`. Each
  part loses `kerf/2` on every edge once cut, so doubling it as the
  minimum gap between placed parts is a real, correct calculation.
- **Path geometry offsetting is NOT implemented.** True kerf compensation
  for an arbitrary closed polygon requires polygon offsetting (a
  Minkowski-sum-based algorithm), which is out of scope for this pass.
  `generateManufacturingSvg` embeds the resolved kerf value as an SVG
  comment for traceability, but does not shrink/grow the cut path itself.
  This is documented in the function's doc comment, not silently omitted.

## DXF: why R12, and why hand-written

DXF R12 (AC1009) predates `LWPOLYLINE` (added in R14), so closed cut paths
are written as `POLYLINE` / `VERTEX` / `SEQEND` triplets — more verbose
than modern DXF, but openable in essentially any CAM or laser software,
including very old ones. `generateDxf` is a minimal hand-written writer
covering exactly two entity types (`POLYLINE`, `TEXT`) — not a general
DXF library. If more entity types are needed later (arcs, splines, layers
beyond CUT/ENGRAVE), extend this writer rather than pulling in a full DXF
library for two entity types.

## Nesting: consolidated onto design-engine (post-merge)

`nestForManufacturing` uses `@ramesh/design-engine`'s `nestRectangles`
directly. During parallel branch development, `feature/manufacturing` had
its own copy of the same shelf-packing algorithm (`packRectangles.ts`),
because that branch was created before `feature/design-engine`'s nesting
code existed and couldn't depend on an unmerged package. That duplicate
was removed as part of merging both branches into `develop` — this
package now depends on `@ramesh/design-engine` (see `package.json` and
the `tsconfig.json` project reference) and adds only the
manufacturing-specific concern on top: deriving spacing from the
material's kerf.

## Part numbering: in-memory sequencer, not yet persisted

`PartNumberSequencer` keeps counts in a `Map`, cached on `globalThis` the
same way `packages/database`'s Prisma client singleton is (to survive
Next.js dev-mode hot reloads). This resets on process restart — acceptable
today since no `Part`/`Product` table exists yet to persist counters
against. See DATABASE.md for the intended real-persistence design.
