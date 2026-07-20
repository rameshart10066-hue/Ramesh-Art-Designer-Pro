# Dashboard Module

Landing page after login: key business metrics plus navigation cards into
each business module.

## What's included

- `GET /api/dashboard/summary` returning metrics + module nav list
- `DashboardOverview` — fetches and renders the summary
- `SummaryCard` / `ModuleCard` — reusable presentation components

## Folder map

```
packages/api-contracts/src/dashboard.ts   DashboardSummary/DashboardMetric/ModuleLink

apps/web/src/lib/dashboard/
  getDashboardSummary.ts   builds the summary payload (placeholder data)
  index.ts

apps/web/src/app/api/dashboard/summary/route.ts

apps/web/src/services/dashboardService.ts

apps/web/src/modules/dashboard/
  components/SummaryCard.tsx
  components/ModuleCard.tsx
  components/DashboardOverview.tsx
  formatMetricValue.ts
  __tests__/formatMetricValue.test.ts
  index.ts

apps/web/src/app/dashboard/page.tsx
```

## Related docs

- [API.md](./API.md)
- [FLOW.md](./FLOW.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE.md](./DATABASE.md)
- [EXAMPLES.md](./EXAMPLES.md)
