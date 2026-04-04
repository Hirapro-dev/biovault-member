"use client";

import { useState } from "react";

export default function StaffReferralUrlSection({ staffCode }: { staffCode: string }) {
  const [agencyCode, setAgencyCode] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  // 従業員専用URL
  const staffUrl = `${baseUrl}/form/app?staff=${staffCode}`;

  // 代理店連携URL
  const comboUrl = agencyCode.trim()
    ? `${baseUrl}/form/app?ref=${agencyCode.trim()}&staff=${staffCode}`
    : "";

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

  return (
    <div className="mt-6 bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
      <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
        紹介URL発行
      </h3>

      {/* 従業員専用URL */}
      <div className="mb-5">
        <label className="block text-[11px] text-text-muted mb-2">従業員専用URL</label>
        <div className="flex gap-2">
          <input value={staffUrl} readOnly className="flex-1 px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-[12px] text-text-secondary font-mono outline-none" />
          <button
            onClick={() => handleCopy(staffUrl, "staff")}
            className="px-4 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[12px] font-semibold cursor-pointer hover:opacity-90 transition-all shrink-0"
          >
            {copied === "staff" ? "✓ コピー済" : "コピー"}
          </button>
        </div>
        <p className="text-[10px] text-text-muted mt-1.5">
          このURLから申込があった場合、自動的にこの従業員に紐付けされます
        </p>
      </div>

      {/* 代理店連携URL */}
      <div className="border-t border-border pt-5">
        <label className="block text-[11px] text-text-muted mb-2">代理店連携URL（代理店 + 従業員）</label>
        <div className="flex gap-2 mb-2">
          <input
            value={agencyCode}
            onChange={(e) => setAgencyCode(e.target.value)}
            placeholder="代理店コード（例: AG-0001）"
            className="flex-1 px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none transition-colors focus:border-border-gold"
          />
        </div>
        {comboUrl && (
          <div className="flex gap-2 mt-2">
            <input value={comboUrl} readOnly className="flex-1 px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-[12px] text-text-secondary font-mono outline-none" />
            <button
              onClick={() => handleCopy(comboUrl, "combo")}
              className="px-4 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[12px] font-semibold cursor-pointer hover:opacity-90 transition-all shrink-0"
            >
              {copied === "combo" ? "✓ コピー済" : "コピー"}
            </button>
          </div>
        )}
        <p className="text-[10px] text-text-muted mt-1.5">
          代理店コードを入力すると、代理店と従業員の両方に紐付けされるURLが生成されます
        </p>
      </div>
    </div>
  );
}
