# Catalog Module — Examples

## curl

```bash
# All products, page 1
curl -s "http://localhost:3000/api/catalog" | jq

# Search + category filter + pagination
curl -s "http://localhost:3000/api/catalog?search=nameplate&categoryId=cat-nameplates&page=1&pageSize=6" | jq

# Categories
curl -s "http://localhost:3000/api/catalog/categories" | jq
```

## Using queryCatalog directly (e.g. in a script or test)

```ts
import { queryCatalog } from "@/lib/catalog";
import type { Product } from "@ramesh/api-contracts";

const products: Product[] = [
  /* ... */
];
const result = queryCatalog(products, { search: "coaster", page: 1, pageSize: 10 });
console.log(`${result.total} matches across ${result.totalPages} page(s)`);
```

## React — embedding the theme provider elsewhere

```tsx
import { CatalogThemeProvider, ThemeToggle } from "@/modules/catalog";

function CatalogPreviewWidget() {
  return (
    <CatalogThemeProvider>
      <ThemeToggle />
      {/* any catalog components here inherit the scoped theme */}
    </CatalogThemeProvider>
  );
}
```
