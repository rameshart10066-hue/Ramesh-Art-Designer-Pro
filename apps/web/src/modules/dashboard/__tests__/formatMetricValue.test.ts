import { describe, expect, it } from "vitest";
import { formatMetricValue } from "../formatMetricValue";

describe("formatMetricValue", () => {
  it("formats a count metric with locale grouping", () => {
    const result = formatMetricValue({
      key: "activeOrders",
      label: "Active Orders",
      value: 1234,
      format: "count",
    });
    expect(result).toBe("1,234");
  });

  it("formats a currency metric as INR with no decimals", () => {
    const result = formatMetricValue({
      key: "revenue",
      label: "Revenue",
      value: 50000,
      format: "currency",
    });
    expect(result).toContain("50,000");
    expect(result).toMatch(/₹/);
  });

  it("formats zero correctly for both formats", () => {
    expect(
      formatMetricValue({ key: "a", label: "A", value: 0, format: "count" }),
    ).toBe("0");
    expect(
      formatMetricValue({ key: "b", label: "B", value: 0, format: "currency" }),
    ).toMatch(/₹\s?0/);
  });
});
