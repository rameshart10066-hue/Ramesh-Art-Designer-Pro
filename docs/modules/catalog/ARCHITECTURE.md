# Catalog Module — Architecture

## Pure query logic, testable without a server

`queryCatalog(products, query)` in `lib/catalog/queryCatalog.ts` takes the
product array as a parameter instead of importing `data.ts` directly. This
means the 8-test suite in `__tests__/queryCatalog.test.ts` runs against
hand-built fixtures, not the placeholder seed data — so the tests keep
passing unchanged once real data replaces the placeholder.

Page clamping: if a filter change makes the current page invalid (e.g. 3
results now exist but the user was on page 5), `queryCatalog` returns the
last valid page instead of an empty result or an error. `CatalogOverview`
also proactively resets to page 1 whenever search or category changes, so
this clamp is a safety net, not the primary UX.

## Dark theme is module-scoped, not app-wide

`CatalogThemeProvider` sets `data-theme` on a wrapper `<div>`, not
`document.documentElement`. All theme CSS lives in
`catalog-theme.module.css` as custom properties scoped under `.root`. This
was a deliberate choice to respect "only catalog module" scope — an
app-wide theme would require editing the shared root `layout.tsx`, which
this module doesn't touch. If a global theme is wanted later, this
provider's pattern (context + `data-theme` + CSS custom properties) can be
lifted to the root layout; the catalog module's version would then be
redundant and should be removed at that point, not left in place.

## Component responsibilities

```
CatalogOverview          <- owns all state: search text, category, page
      |
  SearchBar               presentation only (controlled input)
  CategoryFilter           presentation only
  Pagination                presentation only
  ProductCard[]              presentation only
  ThemeToggle                 reads/writes via useCatalogTheme() context
```

`useDebouncedValue` lives inside `modules/catalog/hooks/`, not the shared
`src/hooks/`, since nothing else uses it yet — the code comment on that
file says to promote it to the shared folder if a second module needs the
same debounce behavior, rather than duplicating it.
