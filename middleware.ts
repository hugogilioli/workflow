import { auth } from "@/auth";
import type { NextRequest } from "next/server";

export default auth((req: NextRequest) => {
  const session = (req as any).auth;
  const isLoggedIn = !!session;
  const pathname = req.nextUrl.pathname;

  const isProtected =
    pathname.startsWith("/requests") ||
    pathname.startsWith("/materials") ||
    pathname.startsWith("/admin");

  const isAuthPage = pathname.startsWith("/login");

  if (isProtected && !isLoggedIn) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return Response.redirect(url);
  }

  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/requests", req.nextUrl.origin));
  }

  // Admin-only area
  if (pathname.startsWith("/admin")) {
    const role = session?.user?.role;
    if (role !== "ADMIN") {
      return Response.redirect(new URL("/requests", req.nextUrl.origin));
    }
  }

  return;
});

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};
