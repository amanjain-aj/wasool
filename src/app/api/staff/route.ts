import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { errorResponse, readJson, HttpError } from "@/lib/http";
import { normalizeIndianPhone } from "@/lib/upi";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenant_id");
    if (!tenantId) throw new HttpError(400, "tenant_id query parameter is required");

    const store = getStore();
    const staff = await store.listStaff(tenantId);
    return NextResponse.json({ ok: true, staff });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tenant_id, staff_name, staff_phone, require_owner_approval } = await readJson<{
      tenant_id: string;
      staff_name: string;
      staff_phone: string;
      require_owner_approval?: boolean;
    }>(req);

    if (!tenant_id || !staff_name?.trim() || !staff_phone?.trim()) {
      throw new HttpError(422, "tenant_id, staff_name, and staff_phone are required");
    }

    const cleanPhone = normalizeIndianPhone(staff_phone);
    if (!cleanPhone) {
      throw new HttpError(422, "Please enter a valid 10-digit Indian phone number");
    }

    const store = getStore();
    const staff = await store.createStaff(tenant_id, {
      staff_name: staff_name.trim(),
      staff_phone: cleanPhone,
      require_owner_approval: require_owner_approval ?? true,
    });

    return NextResponse.json({ ok: true, staff }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
