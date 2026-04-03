"use client";

import { useState } from "react";

export default function ReferralUrlSection({ agencyCode }: { agencyCode: string }) {
  const [repName, setRepName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  // ベースURLを動的に取得
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  // 代理店用URL（営業担当なし）
  const agencyUrl = `${baseUrl}/form/app?ref=${agencyCode}`;

  // 営業担当者付きURL
  const repUrl = repName.trim()
    ? `${baseUrl}/form/app?ref=${agencyCode}&rep=${encodeURIComponent(repName.trim())}`
    : "";

  const handleCopy = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // フォールバック
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  if (!agencyCode) return null;

  return (
    <div className="mt-6 bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
      <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
        紹介URL発行
      </h3>

      {/* 代理店用URL */}
      <div className="mb-5">
        <label className="block text-[11px] text-text-muted mb-2">代理店紹介URL</label>
        <div className="flex gap-2">
          <input
            value={agencyUrl}
            readOnly
            className="flex-1 px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-[12px] text-text-secondary font-mono outline-none"
          />
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

      {/* 営業担当者付きURL */}
      <div className="border-t border-border pt-5">
        <label className="block text-[11px] text-text-muted mb-2">営業担当者付きURL</label>
        <div className="flex gap-2 mb-2">
          <input
            value={repName}
            onChange={(e) => setRepName(e.target.value)}
            placeholder="営業担当者名を入力"
            className="flex-1 px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none transition-colors focus:border-border-gold"
          />
        </div>
        {repUrl && (
          <div className="flex gap-2 mt-2">
            <input
              value={repUrl}
              readOnly
              className="flex-1 px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-[12px] text-text-secondary font-mono outline-none"
            />
            <button
              onClick={() => handleCopy(repUrl, "rep")}
              className="px-4 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[12px] font-semibold cursor-pointer hover:opacity-90 transition-all shrink-0"
            >
              {copied === "rep" ? "✓ コピー済" : "コピー"}
            </button>
          </div>
        )}
        <p className="text-[10px] text-text-muted mt-1.5">
          営業担当者名を入力すると、その担当者専用のURLが生成されます。申込時に自動で紐付けされます。
        </p>
      </div>
    </div>
  );
}
