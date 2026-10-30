import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env, isSupabaseConfigured } from "@/lib/config";
import { getStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
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
