# Dashboard Module — Examples

## curl

```bash
curl -s http://localhost:3000/api/dashboard/summary | jq
```

## React — rendering the dashboard elsewhere (e.g. a sidebar widget)

```tsx
import { SummaryCard } from "@/modules/dashboard";
import { getDashboardSummary } from "@/services/dashboardService";

async function TopMetric() {
  const summary = await getDashboardSummary();
  const first = summary.metrics[0];
  return first ? <SummaryCard metric={first} /> : null;
}
```

## Server — building the summary directly (e.g. for an email digest)

```ts
import { getDashboardSummary } from "@/lib/dashboard";

const summary = getDashboardSummary();
console.log(`Active orders: ${summary.metrics.find((m) => m.key === "activeOrders")?.value}`);
```
