"use client";

import { useState } from "react";

/**
 * 代理店専用のiPS適合確認申込フォームURL表示。
 * 担当営業マンが代理店本人にURLを案内する用途を想定。
 * URL: /form/app?ref=<agencyCode>
 * このURLからの申込はAPI側のロジックにより自動的にこの代理店経由として記録される。
 */
export default function AgencyReferralUrl({ agencyCode }: { agencyCode: string }) {
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const formUrl = `${baseUrl}/form/app?ref=${agencyCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-bg-secondary border border-border-gold rounded-md p-4 sm:p-6 mb-5">
      <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-3 pb-3 border-b border-border">
        代理店専用 iPS細胞作製適合確認申込フォーム
      </h3>
      <p className="text-xs text-text-muted mb-3">
        この代理店が顧客に案内するためのURLです。このURLからの申込は自動的に当該代理店経由として記録されます。
      </p>
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
