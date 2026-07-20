# Manufacturing Module — Examples

## curl

```bash
# Manufacturing SVG (cut + engrave layers)
curl -s -X POST http://localhost:3000/api/manufacturing/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type":"svg","widthMm":100,"heightMm":60,
    "cutPaths":[{"points":[{"x":0,"y":0},{"x":100,"y":0},{"x":100,"y":60},{"x":0,"y":60}]}],
    "engraveTexts":[{"x":50,"y":30,"text":"Ramesh Acrylics"}],
    "materialProfileId":"acrylic-3mm"
  }' | jq -r .output

# DXF export
curl -s -X POST http://localhost:3000/api/manufacturing/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type":"dxf",
    "cutPaths":[{"points":[{"x":0,"y":0},{"x":100,"y":0},{"x":100,"y":60},{"x":0,"y":60}]}]
  }' | jq -r .output > part.dxf

# Nesting
curl -s -X POST http://localhost:3000/api/manufacturing/nesting \
  -H "Content-Type: application/json" \
  -d '{
    "parts":[{"id":"a","widthMm":30,"heightMm":20},{"id":"b","widthMm":30,"heightMm":20}],
    "sheetWidthMm":300,"sheetHeightMm":200,
    "materialProfileId":"acrylic-5mm"
  }' | jq

# Part number
curl -s -X POST http://localhost:3000/api/manufacturing/part-number \
  -H "Content-Type: application/json" \
  -d '{"categoryCode":"NP"}' | jq

# Material profiles
curl -s http://localhost:3000/api/manufacturing/material-profiles | jq
```

## Calling the engine directly (e.g. from a batch/export script)

```ts
import {
  generateManufacturingSvg,
  generateDxf,
  nestForManufacturing,
  generatePartNumber,
  PartNumberSequencer,
} from "@ramesh/manufacturing-engine";

const svg = generateManufacturingSvg({
  widthMm: 100,
  heightMm: 60,
  cutPaths: [{ points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 60 }, { x: 0, y: 60 }] }],
  materialProfileId: "acrylic-3mm",
});

const dxf = generateDxf({
  cutPaths: [{ points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 60 }, { x: 0, y: 60 }] }],
});

const nesting = nestForManufacturing({
  parts: [{ id: "a", widthMm: 30, heightMm: 20 }],
  sheetWidthMm: 300,
  sheetHeightMm: 200,
  materialProfileId: "acrylic-5mm",
});

const sequencer = new PartNumberSequencer();
sequencer.next("NP"); // "NP-2026-0001"
sequencer.next("NP"); // "NP-2026-0002"

generatePartNumber({ categoryCode: "BX", sequence: 42, year: 2026 }); // "BX-2026-0042"
```
