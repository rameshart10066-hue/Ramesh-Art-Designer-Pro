# Design Generator Module

Parametric SVG generation for laser-cut acrylic products: nameplates,
finger-joint boxes, and shape nesting. SVG output only — no DXF, no
manufacturing concerns (kerf, machine profiles). Those are the
`manufacturing-engine` package's job (see `feature/manufacturing`).

## What's included

- `generateNameplateSvg` — rounded-rect outline + centered engraved text
- `generateFingerJointBoxSvg` — open-top box (bottom + 4 interlocking walls)
- `generateNestingSvg` / `nestRectangles` — shelf bin-packing across sheets
- A tabbed studio UI (`/design-studio`) with one form per generator

## Folder map

```
packages/design-engine/src/
  shared/svg.ts                     wrapSvgDocument, escapeSvgText
  nameplate/generateNameplateSvg.ts
  finger-joint-box/
    computeFingerLayout.ts          pure: how many finger segments fit an edge
    buildFingerJointPanelOutline.ts pure: edge/panel point geometry
    generateFingerJointBoxSvg.ts    composes 5 panels into one SVG
  nesting/
    nestRectangles.ts                pure: shelf bin-packing
    generateNestingSvg.ts             renders packing result as SVG
  index.ts                            barrel export

packages/api-contracts/src/design-generator.ts   discriminated request/response union

apps/web/src/lib/design-generator/generateDesign.ts   dispatches by request.type

apps/web/src/app/api/design-generator/generate/route.ts

apps/web/src/services/designGeneratorService.ts

apps/web/src/modules/design-generator/
  components/DesignGeneratorStudio.tsx   tab container
  components/NameplateForm.tsx
  components/FingerJointBoxForm.tsx
  components/NestingForm.tsx
  components/SvgPreview.tsx
  index.ts

apps/web/src/app/design-studio/page.tsx
```

## Related docs

- [API.md](./API.md)
- [FLOW.md](./FLOW.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE.md](./DATABASE.md)
- [EXAMPLES.md](./EXAMPLES.md)
