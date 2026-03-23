import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // 管理者ページへのアクセス制御
    if (path.startsWith("/admin")) {
      if (token?.role !== "ADMIN" && token?.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // パスワード変更が必要な場合
    if (token?.mustChangePassword && path !== "/settings" && !path.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/settings", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/status/:path*", "/documents/:path*", "/glossary/:path*", "/treatment/:path*", "/concierge/:path*", "/settings/:path*", "/admin/:path*"],
};
