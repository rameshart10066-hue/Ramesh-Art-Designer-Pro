# Catalog Module — Database

No tables yet. Product/category data is static, in
`apps/web/src/lib/catalog/data.ts` (6 sample products across 4 categories,
matching the acrylic product lines: nameplates, boxes, coasters, decor).

## Proposed schema (not built)

```prisma
model Category {
  id       String    @id @default(cuid())
  name     String
  slug     String    @unique
  products Product[]

  @@map("categories")
}

model Product {
  id          String   @id @default(cuid())
  sku         String   @unique
  name        String
  description String
  price       Int      // paise/cents, avoid float rounding on money
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])

  @@map("products")
}
```

`queryCatalog`'s search/filter/pagination logic is written against plain
`Product[]` arrays, not against `data.ts` specifically — swapping
`PRODUCTS`/`CATEGORIES` for a Prisma query in the API route is the only
change needed once this schema exists; `queryCatalog` itself doesn't
change.
