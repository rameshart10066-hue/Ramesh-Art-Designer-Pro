import type { DesignGeneratorRequest, DesignGeneratorResponse } from "@ramesh/api-contracts";

/**
 * Client-side design generator service — the design studio UI calls this
 * instead of fetch() directly, matching the pattern used by other
 * modules' services.
 */
export async function generateDesign(
  request: DesignGeneratorRequest,
): Promise<DesignGeneratorResponse> {
  const response = await fetch("/api/design-generator/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return (await response.json()) as DesignGeneratorResponse;
}
