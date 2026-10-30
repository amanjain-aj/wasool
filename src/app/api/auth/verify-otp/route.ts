// POST /api/auth/verify-otp
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, HttpError, readJson } from "@/lib/http";
import { isSupabaseConfigured, env } from "@/lib/config";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { email, token } = await readJson<{ email: string; token: string }>(req);
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail || !token?.trim()) {
      throw new HttpError(422, "Email and 6-digit OTP code are required");
    }

    if (isSupabaseConfigured()) {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        env.supabaseUrl(),
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.supabaseServiceKey(),
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            },
          },
        }
      );

      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: token.trim(),
        type: "email",
      });

      if (error) {
        throw new HttpError(400, error.message);
      }

      // Check tenant
      const store = getStore();
      const tenants = await store.listTenants();
      const tenant = tenants.find((t) => t.owner_email.toLowerCase() === cleanEmail);

      return NextResponse.json({
        ok: true,
        user: data.user,
        tenant_id: tenant?.id || null,
      });
    }

    // Demo Mode: Mock verification code (accepts 123456 or any 6-digit code)
    const store = getStore();
    const tenants = await store.listTenants();
    const tenant = tenants.find((t) => t.owner_email.toLowerCase() === cleanEmail) || tenants[0];

    const response = NextResponse.json({
      ok: true,
      tenant_id: tenant?.id,
      mode: "demo",
    });

    response.cookies.set("wasool_demo_user", cleanEmail, {
      path: "/",
      httpOnly: false,
      maxAge: 86400 * 7,
    });

    return response;
  } catch (err) {
    return errorResponse(err);
  }
}
