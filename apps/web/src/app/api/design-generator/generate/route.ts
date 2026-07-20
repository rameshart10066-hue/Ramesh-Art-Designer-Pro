import { NextResponse } from "next/server";
import type { DesignGeneratorRequest } from "@ramesh/api-contracts";
import { generateDesign } from "@/lib/design-generator";

/**
 * POST /api/design-generator/generate
 * Thin HTTP adapter over generateDesign. Body shape is discriminated by
 * `type` (nameplate | finger-joint-box | nesting) — see api-contracts.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: DesignGeneratorRequest;

  try {
    body = (await request.json()) as DesignGeneratorRequest;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const result = generateDesign(body);
  return NextResponse.json(result, { status: result.success ? 200 : 422 });
}
