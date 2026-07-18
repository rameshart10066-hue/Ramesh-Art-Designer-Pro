import { NextResponse } from "next/server";
import type { ManufacturingGenerateRequest } from "@ramesh/api-contracts";
import { generateManufacturingOutput } from "@/lib/manufacturing";

/**
 * POST /api/manufacturing/generate
 * Thin HTTP adapter over generateManufacturingOutput. Body is
 * discriminated by `type` ("svg" | "dxf") — see api-contracts.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: ManufacturingGenerateRequest;

  try {
    body = (await request.json()) as ManufacturingGenerateRequest;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const result = generateManufacturingOutput(body);
  return NextResponse.json(result, { status: result.success ? 200 : 422 });
}
