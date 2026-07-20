import { describe, expect, it } from "vitest";
import { getDashboardSummary } from "../getDashboardSummary";
import { formatMetricValue } from "../../../modules/dashboard/formatMetricValue";

describe("dashboard integration: lib output -> UI formatting", () => {
  it("every metric getDashboardSummary returns can be formatted without throwing", () => {
    const summary = getDashboardSummary();
    for (const metric of summary.metrics) {
      expect(() => formatMetricValue(metric)).not.toThrow();
    }
  });

  it("module hrefs are all absolute, app-relative paths", () => {
    const summary = getDashboardSummary();
    for (const module of summary.modules) {
      expect(module.href.startsWith("/")).toBe(true);
    }
  });

  it("metric and module keys are unique (used as React list keys)", () => {
    const summary = getDashboardSummary();
    const metricKeys = summary.metrics.map((m) => m.key);
    const moduleKeys = summary.modules.map((m) => m.key);
    expect(new Set(metricKeys).size).toBe(metricKeys.length);
    expect(new Set(moduleKeys).size).toBe(moduleKeys.length);
  });
});
