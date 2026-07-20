import type {
  ManufacturingGenerateRequest,
  ManufacturingGenerateResponse,
  MaterialProfile,
  NestingRequest,
  NestingResponse,
  PartNumberResponse,
} from "@ramesh/api-contracts";

/**
 * Client-side manufacturing service — the manufacturing UI calls these
 * instead of fetch() directly, matching the pattern used by other
 * modules' services.
 */
export async function generateManufacturingOutput(
  request: ManufacturingGenerateRequest,
): Promise<ManufacturingGenerateResponse> {
  const response = await fetch("/api/manufacturing/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return (await response.json()) as ManufacturingGenerateResponse;
}

export async function runNesting(request: NestingRequest): Promise<NestingResponse> {
  const response = await fetch("/api/manufacturing/nesting", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return (await response.json()) as NestingResponse;
}

export async function generatePartNumber(categoryCode: string): Promise<PartNumberResponse> {
  const response = await fetch("/api/manufacturing/part-number", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categoryCode }),
  });
  return (await response.json()) as PartNumberResponse;
}

export async function getMaterialProfiles(): Promise<MaterialProfile[]> {
  const response = await fetch("/api/manufacturing/material-profiles");
  return (await response.json()) as MaterialProfile[];
}
