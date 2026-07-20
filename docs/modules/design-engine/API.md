# Design Generator Module — API Reference

Types in `packages/api-contracts/src/design-generator.ts`.

## POST /api/design-generator/generate

Body is a discriminated union on `type`.

### type: "nameplate"
```ts
{
  type: "nameplate";
  text: string;
  widthMm: number;
  heightMm: number;
  cornerRadiusMm?: number;  // default 4
  fontSizeMm?: number;      // default 10
}
```

### type: "finger-joint-box"
```ts
{
  type: "finger-joint-box";
  widthMm: number;
  depthMm: number;
  heightMm: number;
  materialThicknessMm: number;
  targetFingerWidthMm?: number;  // default 10
}
```

### type: "nesting"
```ts
{
  type: "nesting";
  shapes: Array<{ id: string; widthMm: number; heightMm: number }>;
  sheetWidthMm: number;
  sheetHeightMm: number;
  spacingMm?: number;  // default 5
}
```

### Response — 200 OK
```ts
{ success: true; svg: string }
```

### Response — 422 Unprocessable Entity
```ts
{ success: false; error: string }
```

Common validation errors: empty nameplate text, non-positive dimensions,
a nesting shape larger than the sheet, an empty shape list.
