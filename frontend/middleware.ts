import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, verifyAuthCookieEdge } from "@/lib/auth-edge";

// Routes that never require the archive passphrase.
// - /api/v1/*  : Bearer-token authenticated external API (adapter + Bridge CAP
//                consumers). Has its own auth in lib/apiAuth.ts — must keep
//                working unchanged, so it is fully exempt from this gate.
// - /login     : the gate's own login page + its POST route.
// - _next/*    : static assets, favicon.
const PUBLIC_PREFIXES = ["/api/v1/", "/login", "/api/login", "/_next/"];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/api/v1") return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix)) return true;
  }
  if (pathname === "/favicon.ico") return true;
  // static assets served from /public
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|woff2?)$/.test(pathname)) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  if (await verifyAuthCookieEdge(cookie)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  const next = pathname + (search || "");
  if (next && next !== "/") {
    loginUrl.searchParams.set("next", next);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image).*)",
  ],
};
