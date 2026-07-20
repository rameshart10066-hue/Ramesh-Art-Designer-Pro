# Dashboard Module — Architecture

## Layering

```
DashboardPage (route)
      |
DashboardOverview   <- owns loading/error state, fetches once on mount
      |         \
SummaryCard   ModuleCard   <- presentation-only, no data fetching
```

`SummaryCard` and `ModuleCard` take a single item as a prop and render it —
neither knows where its data came from. `DashboardOverview` is the only
component that calls `dashboardService`, so swapping the data source (e.g.
adding polling, or React Query) only touches one file.

`formatMetricValue` is a standalone pure function, not inlined into
`SummaryCard`, specifically so it's unit-testable without rendering React
(`__tests__/formatMetricValue.test.ts`).

## Why the summary data is static

`getDashboardSummary()` in `apps/web/src/lib/dashboard/` returns
hand-written placeholder data. No `Order`, `Design`, or `Revenue` tables
exist in `packages/database` yet — those land with their own feature
branches (catalog has product data; a future orders/finance module would
own the rest). `getDashboardSummary()` is the **only** function that
touches this data, so replacing it with real Prisma queries later doesn't
require touching the route, the service, or any component.

## No auth check (documented gap, not an oversight)

This branch (`feature/dashboard`) was built before `feature/auth`'s route
protection middleware was merged. `GET /api/dashboard/summary` is
currently unauthenticated. Once branches merge, this route should sit
behind the same middleware matcher (`/dashboard/:path*`) that already
protects the page itself — the API route is currently the gap, not the
page.
