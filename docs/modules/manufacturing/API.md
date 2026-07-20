# Manufacturing Module — API Reference

Types in `packages/api-contracts/src/manufacturing.ts`.

## POST /api/manufacturing/generate

Discriminated on `type`.

### type: "svg"
```ts
{
  type: "svg";
  widthMm: number;
  heightMm: number;
  cutPaths: Array<{ points: Array<{x:number;y:number}>; closed?: boolean }>;
  engraveTexts?: Array<{ x: number; y: number; text: string; fontSizeMm?: number }>;
  materialProfileId: string;  // see GET /api/manufacturing/material-profiles
}
```

### type: "dxf"
```ts
{
  type: "dxf";
  cutPaths: Array<{ points: Array<{x:number;y:number}>; closed?: boolean }>;
  texts?: Array<{ x: number; y: number; text: string; fontSizeMm?: number }>;
}
```

### Response — 200 OK
```ts
{ success: true; format: "svg" | "dxf"; output: string }
```

### Response — 422 Unprocessable Entity
```ts
{ success: false; error: string }
```

## POST /api/manufacturing/nesting

```ts
{
  parts: Array<{ id: string; widthMm: number; heightMm: number }>;
  sheetWidthMm: number;
  sheetHeightMm: number;
  materialProfileId: string;
  extraSpacingMm?: number;  // default 0
}
```

**Response — 200 OK**
```ts
{
  success: true;
  placements: Array<{ id: string; sheetIndex: number; x: number; y: number; widthMm: number; heightMm: number }>;
  sheetsUsed: number;
  appliedSpacingMm: number;  // = materialProfile.kerfMm * 2 + extraSpacingMm
}
```

**Response — 422** — same shape as generate's error response.

## POST /api/manufacturing/part-number

```ts
{ categoryCode: string }  // e.g. "NP", "BX"
```

**Response — 200 OK**
```ts
{ partNumber: string }  // e.g. "NP-2026-0001"
```

Sequence increments per category, per server process (see
ARCHITECTURE.md / DATABASE.md for the in-memory caveat).

## GET /api/manufacturing/material-profiles

No parameters.

**Response — 200 OK**
```ts
Array<{
  id: string;
  name: string;
  thicknessMm: number;
  kerfMm: number;
  cutSpeedMmPerMin: number;
  cutPowerPercent: number;
  engraveSpeedMmPerMin: number;
  engravePowerPercent: number;
}>
```

Ships with `acrylic-3mm`, `acrylic-5mm`, `acrylic-8mm`.
