# Catalog Module

Product browsing: search, category filter, pagination, and a dark theme
scoped to this page only.

## What's included

- `GET /api/catalog` — search + category filter + pagination
- `GET /api/catalog/categories`
- Debounced search (300ms)
- Dark/light theme toggle, isolated to the catalog page via CSS Modules +
  a wrapper `data-theme` attribute (does not affect the rest of the app)

## Folder map

```
packages/api-contracts/src/catalog.ts   Product/Category/CatalogQuery/CatalogResponse

apps/web/src/lib/catalog/
  data.ts            placeholder product/category seed data
  queryCatalog.ts    pure search + filter + pagination logic
  index.ts

apps/web/src/app/api/catalog/route.ts
apps/web/src/app/api/catalog/categories/route.ts

apps/web/src/services/catalogService.ts

apps/web/src/modules/catalog/
  components/SearchBar.tsx
  components/CategoryFilter.tsx
  components/Pagination.tsx
  components/ProductCard.tsx
  components/ThemeToggle.tsx
  components/CatalogOverview.tsx
  theme/CatalogThemeProvider.tsx
  theme/catalog-theme.module.css
  hooks/useDebouncedValue.ts
  index.ts

apps/web/src/app/catalog/page.tsx
```

## Related docs

- [API.md](./API.md)
- [FLOW.md](./FLOW.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE.md](./DATABASE.md)
- [EXAMPLES.md](./EXAMPLES.md)
