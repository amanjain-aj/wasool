import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { errorResponse, readJson } from "@/lib/http";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const patch = await readJson<Record<string, unknown>>(req);
    const store = getStore();

    const updated = await store.updateTenant(id, patch);
    await store.logAdminAction("superadmin@wasool.io", "UPDATE_TENANT_STATUS", id, patch);

    return NextResponse.json({ ok: true, tenant: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
