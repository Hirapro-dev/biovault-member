import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // ── 管理者エリア ──
    if (path.startsWith("/admin")) {
      if (token?.role !== "ADMIN" && token?.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return NextResponse.next();
    }

    // ── 代理店エリア ──
    if (path.startsWith("/agency")) {
      // 代理店申込フォームは公開ページ（認証不要）
      if (path.startsWith("/agency/form")) {
        return NextResponse.next();
      }
      // 代理店ロール以外はアクセス不可
      if (token?.role !== "AGENCY") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      // 代理店同意ページ自体は常にアクセス可能
      if (path === "/agency-agree") {
        return NextResponse.next();
      }
      // 未同意の場合は同意ページへ
      if (token?.agencyAgreed === false) {
        return NextResponse.redirect(new URL("/agency-agree", req.url));
      }
      return NextResponse.next();
    }

    // ── 代理店同意ページ ──
    if (path === "/agency-agree") {
      return NextResponse.next();
    }

    // ── 会員エリア ──

    // 重要事項ページ自体は常にアクセス可能
    if (path === "/important-notice") {
      return NextResponse.next();
    }

    // 代理店ユーザーが会員ページにアクセスしようとした場合
    if (token?.role === "AGENCY") {
      return NextResponse.redirect(new URL("/agency", req.url));
    }

    // 重要事項説明に未同意の場合
    if (token?.hasAgreedTerms === false) {
      return NextResponse.redirect(new URL("/important-notice", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // 代理店申込フォームは認証不要
        if (req.nextUrl.pathname.startsWith("/agency/form")) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*", "/mypage/:path*", "/status/:path*", "/documents/:path*",
    "/glossary/:path*", "/treatment/:path*", "/concierge/:path*",
    "/settings/:path*", "/admin/:path*", "/about-ips/:path*",
    "/important-notice", "/apply-service/:path*", "/favorites/:path*", "/info/:path*", "/pamphlet/:path*",
    "/agency/:path*", "/agency-agree",
  ],
};
