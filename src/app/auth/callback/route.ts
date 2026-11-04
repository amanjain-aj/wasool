import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env, isSupabaseConfigured } from "@/lib/config";
import { getStore } from "@/lib/store";

function getCallbackOrigin(req: NextRequest): string {
  const appUrl = env.appUrl();
  if (appUrl && !appUrl.includes("localhost")) {
    return appUrl;
  }
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || (host && !host.includes("localhost") ? "https" : "http");
  if (host && !host.includes("localhost")) {
    return `${proto}://${host}`;
  }
  return new URL(req.url).origin || appUrl || "http://localhost:3000";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const origin = getCallbackOrigin(req);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code && isSupabaseConfigured()) {
    const cookieStore = req.cookies;
    const response = NextResponse.redirect(new URL(next, origin));

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
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user?.email) {
      const email = data.user.email.toLowerCase();
      const store = getStore();
      const tenants = await store.listTenants();
      const tenant = tenants.find((t) => t.owner_email.toLowerCase() === email);

      if (tenant) {
        return NextResponse.redirect(new URL(`/dashboard?tenant=${tenant.id}`, origin));
      } else {
        return NextResponse.redirect(new URL("/signup", origin));
      }
    }
  }

  return NextResponse.redirect(new URL("/login?error=Invalid+or+expired+link", origin));
}
