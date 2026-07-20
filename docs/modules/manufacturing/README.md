# Manufacturing Module

Turns cut-path geometry into machine-ready output: manufacturing SVG (with
cut/engrave layers), DXF export, kerf-aware nesting, and part numbering.

## What's included

- `generateManufacturingSvg` — LightBurn stroke-color convention (cut =
  red, engrave = blue)
- `generateDxf` — hand-written minimal DXF R12 writer
- `packRectangles` / `nestForManufacturing` — shelf packing with
  kerf-derived spacing
- `generatePartNumber` / `PartNumberSequencer` — `CATEGORY-YEAR-SEQUENCE`
  numbering
- Material/machine profile catalog (cut/engrave speed & power, kerf)
- A tabbed studio UI (`/manufacturing`) covering all four capabilities

## Folder map

```
packages/manufacturing-engine/src/
  shared/geometry.ts                  Point, CutPath types
  material-profiles/materialProfiles.ts
  svg-generator/generateManufacturingSvg.ts
  dxf-generator/generateDxf.ts
  nesting/
    packRectangles.ts                  self-contained shelf packing (see ARCHITECTURE.md)
    nestForManufacturing.ts             kerf-derived spacing wrapper
  part-numbering/
    generatePartNumber.ts               pure formatter
    PartNumberSequencer.ts               in-memory per-category counter
  index.ts

packages/api-contracts/src/manufacturing.ts

apps/web/src/lib/manufacturing/
  generateManufacturingOutput.ts   dispatches svg | dxf
  runNesting.ts
  partNumberSequencer.ts            server-side singleton instance
  index.ts

apps/web/src/app/api/manufacturing/
  generate/route.ts
  nesting/route.ts
  part-number/route.ts
  material-profiles/route.ts

apps/web/src/services/manufacturingService.ts

apps/web/src/modules/manufacturing/
  components/ManufacturingStudio.tsx   tab container
  components/GenerateOutputForm.tsx
  components/NestingPanel.tsx
  components/PartNumberPanel.tsx
  components/MaterialProfileSelect.tsx
  components/OutputPreview.tsx
  index.ts

apps/web/src/app/manufacturing/page.tsx
```

## Related docs

- [API.md](./API.md)
- [FLOW.md](./FLOW.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE.md](./DATABASE.md)
- [EXAMPLES.md](./EXAMPLES.md)
