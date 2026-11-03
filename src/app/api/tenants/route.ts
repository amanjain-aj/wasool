// GET /api/tenants — tenant switcher
// PATCH /api/tenants — update onboarding settings (UPI VPA, bank details, brand name)
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, HttpError, readJson } from "@/lib/http";
import { getStore } from "@/lib/store";
import { isValidVPA, isValidGSTIN } from "@/lib/upi";

export async function GET() {
  try {
    const tenants = await getStore().listTenants();
    return NextResponse.json({ tenants });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await readJson<{
      id: string;
      upi_vpa?: string;
      bank_account_details?: string;
      brand_display_name?: string;
      gstin?: string;
      morning_digest_enabled?: boolean;
    }>(req);

    if (!body?.id) {
      throw new HttpError(422, "Tenant ID is required");
    }

    if (body.upi_vpa && body.upi_vpa.trim() && !isValidVPA(body.upi_vpa)) {
      throw new HttpError(422, "Invalid UPI VPA format (e.g. business@icici)");
    }

    if (body.gstin && body.gstin.trim() && !isValidGSTIN(body.gstin)) {
      throw new HttpError(422, "Invalid GSTIN format");
    }

    const store = getStore();
    const updated = await store.updateTenant(body.id, {
      ...(body.upi_vpa !== undefined ? { upi_vpa: body.upi_vpa.trim() } : {}),
      ...(body.bank_account_details !== undefined ? { bank_account_details: body.bank_account_details.trim() } : {}),
      ...(body.brand_display_name !== undefined ? { brand_display_name: body.brand_display_name.trim() } : {}),
      ...(body.gstin !== undefined ? { gstin: body.gstin.trim().toUpperCase() } : {}),
      ...(body.morning_digest_enabled !== undefined ? { morning_digest_enabled: body.morning_digest_enabled } : {}),
    });

    return NextResponse.json({ ok: true, tenant: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
