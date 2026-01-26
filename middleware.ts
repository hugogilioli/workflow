import { auth } from "@/auth";
import type { NextRequest } from "next/server";

export default auth((req: NextRequest) => {
  const isLoggedIn = !!(req as any).auth;
  const pathname = req.nextUrl.pathname;

  const isProtected =
    pathname.startsWith("/requests") ||
    pathname.startsWith("/materials");

  const isAuthPage = pathname.startsWith("/login");

  if (isProtected && !isLoggedIn) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return Response.redirect(url);
  }

  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/requests", req.nextUrl.origin));
  }

  return;
});

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};
