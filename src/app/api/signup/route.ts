// POST /api/signup — 14-day free pilot onboarding (creates a DIRECT_BUSINESS tenant)
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, HttpError, readJson } from "@/lib/http";
import { getStore } from "@/lib/store";
import { isValidGSTIN, isValidVPA, normalizeIndianPhone } from "@/lib/upi";

interface SignupBody {
  business_name: string;
  brand_display_name?: string;
  owner_email: string;
  owner_phone: string;
  gstin?: string;
  upi_vpa: string;
  plan_tier?: string;
}

export async function POST(req: NextRequest) {
  try {
    const b = await readJson<SignupBody>(req);
    const problems: string[] = [];
    if (!b.business_name?.trim()) problems.push("Business name is required");
    if (!b.owner_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.owner_email)) problems.push("Valid email is required");
    const phone = normalizeIndianPhone(b.owner_phone);
    if (!phone) problems.push("Valid Indian mobile number is required");
    if (!b.upi_vpa || !isValidVPA(b.upi_vpa)) problems.push("Valid UPI VPA is required (e.g. yourbusiness@icici)");
    if (b.gstin && !isValidGSTIN(b.gstin)) problems.push("GSTIN format looks invalid");
    const plan = b.plan_tier === "growth" ? "growth" : "starter";
    if (problems.length) throw new HttpError(422, problems.join("; "));

    const store = getStore();
    const email = b.owner_email.trim().toLowerCase();
    const existing = (await store.listTenants()).find((t) => t.owner_email.toLowerCase() === email);
    if (existing) throw new HttpError(409, "An account with this email already exists");

    const tenant = await store.upsertTenant({
      type: "DIRECT_BUSINESS",
      business_name: b.business_name.trim(),
      brand_display_name: (b.brand_display_name || b.business_name).trim().slice(0, 100),
      owner_email: email,
      owner_phone: phone!,
      gstin: b.gstin ? b.gstin.trim().toUpperCase() : null,
      upi_vpa: b.upi_vpa.trim(),
      plan_tier: plan,
    });
    return NextResponse.json({ tenant_id: tenant.id, plan_tier: tenant.plan_tier }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
