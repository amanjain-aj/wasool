import { NextRequest, NextResponse } from "next/server";

/**
 * Authentication Middleware:
 * Now that we have dedicated customer login via /login (Supabase Magic Link / OTP)
 * and /signup, we redirect unauthenticated web requests directly to /login instead of
 * triggering the browser's native HTTP Basic Auth alert prompt.
 */
export function middleware(req: NextRequest) {
  const basicPassword = process.env.DASHBOARD_PASSWORD;

  // 1. If DASHBOARD_PASSWORD is configured, allow API / programmatic Basic Auth
  if (basicPassword) {
    const user = process.env.DASHBOARD_USER || "admin";
    const header = req.headers.get("authorization") ?? "";
    if (header.startsWith("Basic ")) {
      try {
        const [u, ...rest] = atob(header.slice(6)).split(":");
        if (u === user && rest.join(":") === basicPassword) return NextResponse.next();
      } catch {
        /* malformed header */
      }
    }
  }

  // 2. Allow requests with a valid demo session cookie or Supabase auth token
  const hasDemoSession = req.cookies.has("wasool_demo_user");
  const hasSupabaseToken = Array.from(req.cookies.getAll()).some((c) =>
    c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  if (hasDemoSession || hasSupabaseToken) {
    return NextResponse.next();
  }

  // 3. If DASHBOARD_PASSWORD is not set, allow open access in demo mode
  if (!basicPassword) {
    return NextResponse.next();
  }

  // 4. For page navigation (/dashboard), redirect cleanly to /login instead of browser popup
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 5. For API routes, return clean 401 JSON without WWW-Authenticate header (no popup)
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/invoices/:path*", "/api/invoices", "/api/tenants/:path*", "/api/tenants"],
};

