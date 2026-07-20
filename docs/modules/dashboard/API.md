# Dashboard Module — API Reference

Types in `packages/api-contracts/src/dashboard.ts`.

## GET /api/dashboard/summary

No parameters. No auth check on this route yet — the auth module's route
protection middleware is a separate branch (`feature/auth`), unmerged as
of this module's implementation. See ARCHITECTURE.md.

**Response — 200 OK**
```ts
{
  metrics: Array<{
    key: string;
    label: string;
    value: number;
    format: "count" | "currency";
  }>;
  modules: Array<{
    key: string;
    label: string;
    description: string;
    href: string;
    status: "available" | "in-progress" | "planned";
  }>;
  generatedAt: string; // ISO timestamp
}
```

Current metrics returned: `activeOrders`, `pendingDesigns`,
`revenueThisMonth` — all placeholder zeros, see DATABASE.md.

Current modules listed: `design-studio` (in-progress), `catalog`
(planned), `manufacturing` (planned), `admin` (planned).
