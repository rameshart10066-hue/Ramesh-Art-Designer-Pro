"use client";

import { useEffect, useState } from "react";
import type { DashboardSummary } from "@ramesh/api-contracts";
import { getDashboardSummary } from "@/services/dashboardService";
import { SummaryCard } from "./SummaryCard";
import { ModuleCard } from "./ModuleCard";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; summary: DashboardSummary };

/**
 * Top-level dashboard container. Owns data fetching and loading/error
 * state; delegates all rendering of individual items to SummaryCard and
 * ModuleCard so those stay reusable and independently testable.
 */
export function DashboardOverview() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    getDashboardSummary()
      .then((summary) => {
        if (!cancelled) setState({ status: "ready", summary });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Failed to load dashboard.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return <p>Loading dashboard…</p>;
  }

  if (state.status === "error") {
    return <p role="alert">{state.message}</p>;
  }

  const { metrics, modules } = state.summary;

  return (
    <div>
      <section aria-label="Key metrics">
        {metrics.map((metric) => (
          <SummaryCard key={metric.key} metric={metric} />
        ))}
      </section>

      <section aria-label="Modules">
        {modules.map((module) => (
          <ModuleCard key={module.key} module={module} />
        ))}
      </section>
    </div>
  );
}
