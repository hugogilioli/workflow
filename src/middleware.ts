import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req: NextRequest) => {
  // ✅ DEBUG (depois você remove)
  console.log("MIDDLEWARE HIT:", req.nextUrl.pathname, "logged:", !!(req as any).auth);

  const session = (req as any).auth;
  const isLoggedIn = !!session;
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/internal") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  if (!isLoggedIn && !isPublic) {
    const url = nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", `${nextUrl.pathname}${nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && pathname === "/login") {
    const url = nextUrl.clone();
    url.pathname = "/requests";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|api/internal|login|_next/static|_next/image|favicon.ico).*)"],
};
