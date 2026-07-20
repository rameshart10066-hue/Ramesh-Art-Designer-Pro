import { NextResponse } from "next/server";
import { MATERIAL_PROFILES } from "@ramesh/manufacturing-engine";
import type { MaterialProfile } from "@ramesh/api-contracts";

/** GET /api/manufacturing/material-profiles */
export function GET(): NextResponse<MaterialProfile[]> {
  return NextResponse.json(MATERIAL_PROFILES);
}
