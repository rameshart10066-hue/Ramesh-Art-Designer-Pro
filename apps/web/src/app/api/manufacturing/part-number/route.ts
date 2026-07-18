import { NextResponse } from "next/server";
import type { PartNumberRequest, PartNumberResponse } from "@ramesh/api-contracts";
import { partNumberSequencer } from "@/lib/manufacturing";

/**
 * POST /api/manufacturing/part-number
 * Issues the next part number for a category from the shared,
 * process-lifetime sequencer (see partNumberSequencer.ts for the
 * in-memory-vs-database tradeoff).
 */
export async function POST(request: Request): Promise<NextResponse<PartNumberResponse>> {
  const body = (await request.json()) as PartNumberRequest;
  const partNumber = partNumberSequencer.next(body.categoryCode);
  return NextResponse.json({ partNumber });
}
