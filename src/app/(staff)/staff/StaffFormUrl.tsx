"use client";

import { useState } from "react";

export default function StaffFormUrl({ staffCode }: { staffCode: string }) {
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const formUrl = `${baseUrl}/form/app?staff=${staffCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-bg-secondary border border-border-gold rounded-md p-4 sm:p-6 mb-8">
      <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-3 pb-3 border-b border-border">
        iPS細胞作製適合確認申込フォーム
      </h3>
      <p className="text-xs text-text-muted mb-3">
        このURLからの申込は自動的にあなたの担当として記録されます。
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
