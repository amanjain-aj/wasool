import { NextRequest, NextResponse } from "next/server";

/**
 * HTTP Basic auth for the tenant dashboard and its internal APIs, enabled when
 * DASHBOARD_PASSWORD is set. Partner APIs (Bearer keys), cron (QStash
 * signature), webhooks (HMAC) and public pages are not affected.
 */
export function middleware(req: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return NextResponse.next();

  const user = process.env.DASHBOARD_USER || "admin";
  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const [u, ...rest] = atob(header.slice(6)).split(":");
      if (u === user && rest.join(":") === password) return NextResponse.next();
    } catch {
      /* malformed header */
    }
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Wasool Dashboard", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/invoices/:path*", "/api/invoices", "/api/tenants/:path*", "/api/tenants"],
};
