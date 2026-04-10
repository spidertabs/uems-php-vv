// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  const path = req.nextUrl.pathname;

  // 🚨 Allow ALL static files (public folder)
  if (
    path.startsWith("/static/") ||
    path.startsWith("/images/") ||
    path.startsWith("/_next/") ||
    path === "/favicon.ico" ||
    path.endsWith(".png") ||
    path.endsWith(".jpg") ||
    path.endsWith(".jpeg") ||
    path.endsWith(".webp") ||
    path.endsWith(".svg")
  ) {
    return NextResponse.next();
  }

  // 🚨 Allow login + register
  if (path.startsWith("/auth/login") || path.startsWith("/auth/register")) {
    return NextResponse.next();
  }

  // 🚨 Allow API
  if (path.startsWith("/api")) {
    return NextResponse.next();
  }

  // 🔐 Protect everything else
  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

// ✅ Matcher
export const config = {
  matcher: [
    "/((?!static/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
