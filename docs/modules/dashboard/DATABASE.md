# Dashboard Module — Database

No tables. The dashboard summary is entirely static placeholder data
returned by `apps/web/src/lib/dashboard/getDashboardSummary.ts`.

## Future schema (not built)

Once real modules exist, the metrics would be computed from:

| Metric | Would query |
|---|---|
| `activeOrders` | An `Order` table (not yet designed) |
| `pendingDesigns` | A `Design`/`Project` table (not yet designed) |
| `revenueThisMonth` | Aggregated from `Order`/`Invoice` (not yet designed) |

No schema is proposed here since these tables belong to whichever module
(orders, finance) actually owns that data — the dashboard should only
ever *read* from other modules' tables, never own business data itself.
