import { NextResponse } from "next/server";
import type { NestingRequest } from "@ramesh/api-contracts";
import { runNesting } from "@/lib/manufacturing";

/** POST /api/manufacturing/nesting */
export async function POST(request: Request): Promise<NextResponse> {
  let body: NestingRequest;

  try {
    body = (await request.json()) as NestingRequest;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const result = runNesting(body);
  return NextResponse.json(result, { status: result.success ? 200 : 422 });
}
