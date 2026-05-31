/**
 * /form-v2-preview/thanks
 *
 * 申請完了サンクス画面のプレビュー用独立ルート。
 *
 * 本番のフォーム送信フローでは /form-v2-preview の done state が立ち
 * 同じ ThanksContent を表示するが、デザイン確認のため独立した URL でも
 * アクセスできるようにしている。
 *
 * - スキーム判定(SCPP/MRT)はパスから自動判定
 * - 表示内容は ThanksContent コンポーネントに集約
 */

"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import V2Wrapper from "@/components/form-v2/V2Wrapper";
import ThanksContent from "@/components/form-v2/ThanksContent";
import { detectSchemeFromPath } from "@/lib/scheme";

export default function ThanksPreviewPage() {
  return (
    <Suspense fallback={<V2Wrapper><div style={{ minHeight: "60vh" }} /></V2Wrapper>}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const pathname = usePathname();
  const scheme = detectSchemeFromPath(pathname);
  return (
    <V2Wrapper
      scheme={scheme}
      headerWide
      title={
        <>
          <span className="v2-banner-title-line">iPS細胞作製の</span>
          <span className="v2-banner-title-line">適合確認申請を</span>
          <br className="v2-banner-title-br-pc" />
          <span className="v2-banner-title-line">受け付けました</span>
        </>
      }
    >
      <ThanksContent scheme={scheme} />
    </V2Wrapper>
  );
}
