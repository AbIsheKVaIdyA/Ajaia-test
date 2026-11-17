import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { USER_COOKIE } from "@/lib/constants";

export function middleware(request: NextRequest) {
  const userId = request.cookies.get(USER_COOKIE)?.value;
  const isLogin = request.nextUrl.pathname === "/login";

  if (!userId && !isLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
