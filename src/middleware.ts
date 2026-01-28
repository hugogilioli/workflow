// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req: NextRequest) => {
  const session = (req as any).auth;
  const isLoggedIn = !!session;

  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Public routes (no auth required)
  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/internal") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  // If NOT logged in, block everything except public routes
  if (!isLoggedIn && !isPublic) {
    const url = nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", `${nextUrl.pathname}${nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  // If logged in and goes to login, send to MENU
  if (isLoggedIn && pathname === "/login") {
    const url = nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Admin-only area
  if (pathname.startsWith("/admin")) {
    const role = session?.user?.role;
    if (role !== "ADMIN") {
      const url = nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|api/internal|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
