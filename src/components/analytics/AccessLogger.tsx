"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * アクセスログを自動記録するコンポーネント
 * ページ遷移ごとにAPIにログを送信（2秒遅延で実行し表示を阻害しない）
 */
export default function AccessLogger() {
  const pathname = usePathname();
  const lastPath = useRef("");

  useEffect(() => {
    // 同じパスへの重複送信を防止
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;

    // ページタイトルのマッピング
    const titleMap: Record<string, string> = {
      "/dashboard": "トップページ",
      "/mypage": "マイページ",
      "/info": "サービス詳細",
      "/favorites": "お気に入り",
      "/apply-service": "サービス申込",
      "/documents": "契約書類",
      "/status": "ステータス詳細",
      "/pamphlet": "パンフレット",
      "/settings": "設定",
      "/settings/profile": "プロフィール",
      "/settings/terms": "利用規約",
      "/settings/legal": "特商法",
      "/settings/privacy": "プライバシーポリシー",
      "/concierge": "コンシェルジュ",
      "/important-notice": "重要事項説明",
      "/treatment": "投与記録",
      "/glossary": "用語集",
      "/about-ips": "コンテンツ",
      "/about-ips/news": "ニュース一覧",
      "/about-ips/history": "iPS細胞の歴史",
      "/about-ips/what-is-ips": "iPS細胞とは",
      "/about-ips/glossary": "用語集",
    };

    // 完全一致 → 前方一致の順で検索
    let pageTitle = titleMap[pathname] || null;
    if (!pageTitle) {
      if (pathname.startsWith("/about-ips/news/")) pageTitle = "記事閲覧";
      else if (pathname.startsWith("/about-ips/video/")) pageTitle = "動画閲覧";
    }

    // 2秒遅延で送信（ページ描画を優先）
    const timer = setTimeout(() => {
      fetch("/api/member/access-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname, pageTitle }),
      }).catch(() => {});
    }, 2000);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
