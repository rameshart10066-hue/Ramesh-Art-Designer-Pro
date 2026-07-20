# Design Generator Module — Examples

## curl

```bash
# Nameplate
curl -s -X POST http://localhost:3000/api/design-generator/generate \
  -H "Content-Type: application/json" \
  -d '{"type":"nameplate","text":"Karan","widthMm":120,"heightMm":40}' | jq -r .svg

# Finger-joint box
curl -s -X POST http://localhost:3000/api/design-generator/generate \
  -H "Content-Type: application/json" \
  -d '{"type":"finger-joint-box","widthMm":150,"depthMm":100,"heightMm":60,"materialThicknessMm":3}' | jq -r .svg

# Nesting
curl -s -X POST http://localhost:3000/api/design-generator/generate \
  -H "Content-Type: application/json" \
  -d '{"type":"nesting","shapes":[{"id":"a","widthMm":30,"heightMm":20},{"id":"b","widthMm":30,"heightMm":20}],"sheetWidthMm":300,"sheetHeightMm":200}' | jq -r .svg
```

## Calling the generators directly (e.g. from a script or a future CLI)

```ts
import { generateNameplateSvg, generateFingerJointBoxSvg } from "@ramesh/design-engine";

const nameplateSvg = generateNameplateSvg({ text: "Ramesh Acrylics", widthMm: 150, heightMm: 40 });

const boxSvg = generateFingerJointBoxSvg({
  widthMm: 150,
  depthMm: 100,
  heightMm: 60,
  materialThicknessMm: 3,
});
```

## Using the pure geometry functions in isolation (e.g. a custom renderer)

```ts
import { computeFingerLayout } from "@ramesh/design-engine";

const layout = computeFingerLayout(60, 10); // edge length 60mm, target 10mm fingers
console.log(layout); // { count: 7 (odd), segmentWidth: 8.57 }
```
