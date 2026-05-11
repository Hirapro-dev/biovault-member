"use client";

import { useState } from "react";

/**
 * 担当営業マン専用の申込フォームURL表示。
 * type="ips" は「iPS細胞作製適合確認」、type="agency" は「代理店登録」フォームへのURLを生成。
 * いずれも ?staff=ST-XXXX 経由で担当営業マンに自動紐付けされる。
 */
export default function StaffFormUrl({
  staffCode,
  type = "ips",
}: {
  staffCode: string;
  type?: "ips" | "agency";
}) {
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const path = type === "agency" ? "/agency/form/app" : "/form/app";
  const formUrl = `${baseUrl}${path}?staff=${staffCode}`;

  const title = type === "agency" ? "代理店登録申込フォーム" : "iPS細胞作製適合確認申込フォーム";
  const description =
    type === "agency"
      ? "代理店として登録される方にこのURLをご案内ください。申込は自動的にあなたの担当として記録されます。"
      : "このURLからの申込は自動的にあなたの担当として記録されます。";

  const handleCopy = () => {
    navigator.clipboard.writeText(formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-bg-secondary border border-border-gold rounded-md p-4 sm:p-6 mb-4">
      <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-3 pb-3 border-b border-border">
        {title}
      </h3>
      <p className="text-xs text-text-muted mb-3">{description}</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={formUrl}
          readOnly
          className="flex-1 px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-xs font-mono outline-none truncate"
        />
        <button
          onClick={handleCopy}
          className="px-4 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-xs font-semibold tracking-wider cursor-pointer shrink-0"
        >
          {copied ? "コピー済み ✓" : "コピー"}
        </button>
      </div>
    </div>
  );
}
