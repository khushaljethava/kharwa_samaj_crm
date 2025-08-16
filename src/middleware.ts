import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  // Placeholder auth gate: send unauthenticated users to login when accessing /dashboard or /members
  const url = new URL(req.url);
  const protectedPrefixes = [
    "/dashboard",
    "/members",
    "/inventory",
    "/relationships",
    "/rent",
    "/purchases",
    "/sales",
    "/properties",
  ];
  const isProtected = protectedPrefixes.some((p) => url.pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Lightweight auth presence check using cookies (middleware runs in Edge)
  const hasSupabaseAuthCookie = Array.from(req.cookies.getAll() || []).some((c) =>
    /^sb-[a-z0-9]+-auth-token(\.\d+)?$/i.test(c.name),
  );
  const hasSession =
    hasSupabaseAuthCookie ||
    req.cookies.get("sb-access-token") ||
    req.cookies.get("sb-refresh-token");
  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", url.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/members/:path*",
    "/inventory/:path*",
    "/relationships/:path*",
    "/rent/:path*",
    "/purchases/:path*",
    "/sales/:path*",
    "/properties/:path*",
  ],
};
