"use client";

import { useState } from "react";

export default function ReferralUrlSection({ agencyCode }: { agencyCode: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  // 代理店用URL
  const agencyUrl = `${baseUrl}/form/app?ref=${agencyCode}`;

  const handleCopy = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!agencyCode) return null;

  return (
    <div className="mt-6 bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
      <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
        紹介URL発行
      </h3>

      {/* 代理店用URL */}
      <div>
        <label className="block text-[11px] text-text-muted mb-2">代理店紹介URL</label>
        <div className="flex gap-2">
          <input value={agencyUrl} readOnly className="flex-1 px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-[12px] text-text-secondary font-mono outline-none" />
          <button
            onClick={() => handleCopy(agencyUrl, "agency")}
            className="px-4 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[12px] font-semibold cursor-pointer hover:opacity-90 transition-all shrink-0"
          >
            {copied === "agency" ? "✓ コピー済" : "コピー"}
          </button>
        </div>
        <p className="text-[10px] text-text-muted mt-1.5">
          このURLから申込があった場合、自動的にこの代理店に紐付けされます
        </p>
      </div>
    </div>
  );
}
