"use client";

import { useState } from "react";
import { getCompany, type SchemeKey } from "@/lib/scheme";

/**
 * 従業員の紹介URL発行パネル（管理画面・従業員ダッシュボード共通UI）。
 *
 * 表示仕様:
 *   ## SCPPスキーム
 *     - iPS細胞作製適合確認申込フォーム（バッジ：SCPP）
 *     - 代理店登録申込フォーム          （バッジ：SCPP）
 *   ## MRTスキーム
 *     - iPS細胞作製適合確認申込フォーム（バッジ：MRT）
 *     - 代理店登録申込フォーム          （バッジ：MRT）
 *
 * URL マッピング:
 *   SCPP + ips    → /form/app?staff=ST-XXXX
 *   SCPP + agency → /agency/form/app?staff=ST-XXXX
 *   MRT  + ips    → /m/form/app?staff=ST-XXXX
 *   MRT  + agency → /m/agency/form/app?staff=ST-XXXX
 */
export default function StaffReferralUrlPanel({ staffCode }: { staffCode: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const buildUrl = (type: "ips" | "agency", scheme: SchemeKey) => {
    const schemePrefix = scheme === "MRT" ? "/m" : "";
    const pathSuffix = type === "agency" ? "/agency/form/app" : "/form/app";
    return `${baseUrl}${schemePrefix}${pathSuffix}?staff=${staffCode}`;
  };

  const handleCopy = async (url: string, key: string) => {
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
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const renderUrlRow = (
    type: "ips" | "agency",
    scheme: SchemeKey,
    title: string,
  ) => {
    const key = `${scheme}-${type}`;
    const url = buildUrl(type, scheme);
    const company = getCompany(scheme);
    return (
      <div className="mb-4 last:mb-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[12px] text-text-secondary">{title}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${company.badgeClass}`}>
            {company.shortName}
          </span>
        </div>
        <div className="flex gap-2">
          <input
            value={url}
            readOnly
            className="flex-1 px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-[12px] text-text-secondary font-mono outline-none truncate"
          />
          <button
            onClick={() => handleCopy(url, key)}
            className="px-4 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[12px] font-semibold cursor-pointer hover:opacity-90 transition-all shrink-0"
          >
            {copied === key ? "✓ コピー済" : "コピー"}
          </button>
        </div>
      </div>
    );
  };

  const renderSchemeSection = (scheme: SchemeKey) => {
    const company = getCompany(scheme);
    return (
      <div className="mb-6 last:mb-0">
        <h4 className="font-serif-jp text-[13px] text-gold tracking-wider mb-3 pb-2 border-b border-border/60">
          {company.name}スキーム
        </h4>
        {renderUrlRow("ips", scheme, "iPS細胞作製適合確認申込フォーム")}
        {renderUrlRow("agency", scheme, "代理店登録申込フォーム")}
      </div>
    );
  };

  return (
    <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
      <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-2 pb-3 border-b border-border">
        紹介URL発行
      </h3>
      <p className="text-[11px] text-text-muted mb-5">
        スキーム（契約主体）ごとに合計4種類のフォームURLが発行されます。顧客に適切なURLを共有してください。
      </p>

      {renderSchemeSection("SCPP")}
      {renderSchemeSection("MRT")}
    </div>
  );
}
