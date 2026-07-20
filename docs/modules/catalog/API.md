# Catalog Module — API Reference

Types in `packages/api-contracts/src/catalog.ts`.

## GET /api/catalog

**Query parameters** (all optional)

| Param | Type | Default |
|---|---|---|
| `search` | string | — (no filter) |
| `categoryId` | string | — (all categories) |
| `page` | number | 1 |
| `pageSize` | number | 12 (client default; server accepts any 1–100) |

**Response — 200 OK**
```ts
{
  items: Product[];
  total: number;
  page: number;       // clamped to the last valid page if out of range
  pageSize: number;
  totalPages: number;
}
```

`Product`:
```ts
{ id: string; sku: string; name: string; description: string; price: number; categoryId: string }
```

## GET /api/catalog/categories

No parameters.

**Response — 200 OK**
```ts
Category[]  // { id: string; name: string; slug: string }[]
```
