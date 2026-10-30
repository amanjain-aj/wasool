// GET /api/tenants — tenant switcher for the dashboard (protected by middleware)
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function GET() {
  try {
    const tenants = await getStore().listTenants();
    return NextResponse.json({ tenants });
  } catch (err) {
    return errorResponse(err);
  }
}
