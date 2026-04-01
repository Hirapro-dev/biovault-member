"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * アクセスログを自動記録するコンポーネント
 * ページ遷移ごとにAPIにログを送信
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
      "/about-ips": "iPS Portal",
      "/dashboard": "マイページ",
      "/info": "基本情報",
      "/favorites": "お気に入り",
      "/apply-service": "サービス申込",
      "/documents": "契約書類",
      "/status": "ステータス詳細",
      "/pamphlet": "BVパンフレット",
      "/settings": "設定",
      "/settings/profile": "プロフィール",
      "/settings/terms": "利用規約",
      "/settings/legal": "特商法",
      "/settings/privacy": "プライバシーポリシー",
      "/concierge": "コンシェルジュ",
      "/important-notice": "重要事項説明",
    };

    // パスからタイトルを推定
    let pageTitle = titleMap[pathname] || null;
    if (!pageTitle) {
      if (pathname.startsWith("/about-ips/news/")) pageTitle = "記事閲覧";
      else if (pathname.startsWith("/about-ips/video/")) pageTitle = "動画閲覧";
      else if (pathname.startsWith("/about-ips")) pageTitle = "iPS Portal";
    }

    // 非同期でログ送信（レスポンスは待たない）
    fetch("/api/member/access-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, pageTitle }),
    }).catch(() => {});
  }, [pathname]);

  return null; // UIは描画しない
}
