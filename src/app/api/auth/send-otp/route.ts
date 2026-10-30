// POST /api/auth/send-otp
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, HttpError, readJson } from "@/lib/http";
import { isSupabaseConfigured, env } from "@/lib/config";
import { createClient } from "@supabase/supabase-js";
import { getStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { email } = await readJson<{ email: string }>(req);
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new HttpError(422, "Please enter a valid work email address");
    }

    // In Live Supabase Mode
    if (isSupabaseConfigured()) {
      const supabase = createClient(
        env.supabaseUrl(),
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.supabaseServiceKey(),
        { auth: { persistSession: false } }
      );

      const origin = req.nextUrl.origin || env.appUrl();
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        throw new HttpError(400, error.message);
      }

      return NextResponse.json({
        ok: true,
        mode: "supabase",
        message: "Magic link / OTP sent to your email.",
      });
    }

    // Demo Mode: Mock verification for instant preview
    const store = getStore();
    const tenants = await store.listTenants();
    const tenant = tenants.find((t) => t.owner_email.toLowerCase() === cleanEmail);

    return NextResponse.json({
      ok: true,
      mode: "demo",
      tenant_id: tenant?.id || tenants[0]?.id,
      message: "Demo Mode: Check wasool-db or proceed with 1-click test code.",
    });
  } catch (err) {
    return errorResponse(err);
  }
}
