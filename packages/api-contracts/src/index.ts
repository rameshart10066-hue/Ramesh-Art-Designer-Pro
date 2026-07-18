/**
 * @ramesh/api-contracts
 *
 * Shared request/response types between apps/web's API routes (backend)
 * and its UI (frontend), plus any future clients. Both sides import from
 * here instead of redeclaring shapes independently — that's what keeps
 * frontend and backend from drifting apart over time.
 *
 * No feature code yet — scaffold-only. Add one file per domain
 * (e.g. `design.ts`, `marketing.ts`, `finance.ts`) and re-export below.
 */

export interface HealthCheckResponse {
  status: "ok" | "degraded" | "down";
  timestamp: string;
}

export * from "./manufacturing";
