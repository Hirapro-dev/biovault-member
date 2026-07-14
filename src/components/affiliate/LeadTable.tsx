"use client";

/**
 * ご紹介協力リード一覧（admin / staff 共用）
 * 行の詳細・架電記録の編集は個別の詳細ページ（[id]）で行う。
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LEAD_CALL_STATUS_LABELS } from "@/lib/affiliate-labels";

export type Lead = {
  id: string;
  name: string;
  nameKana: string;
  email: string;
  phone: string;
  address: string;
  occupation: string | null;
  income: string | null;
  callStatus: string;
  callNote: string | null;
  calledAt: string | null;
  staffCode: string | null;
  formSentAt: string | null;
  applicationId: string | null;
  isDuplicate: boolean;
  createdAt: string;
  affiliateProfile: {
    affiliateCode: string;
    channel: string;
    displayName: string | null;
    user: { name: string };
  };
};

// 適合確認フォームの状況（送信〜提出で会員登録が同時に完了するため、
// applicationId の有無がそのまま「会員一覧に登録済み」を表す）
export type FormStatus = "UNSENT" | "SENT" | "REGISTERED";

export function getFormStatus(l: Pick<Lead, "formSentAt" | "applicationId">): FormStatus {
  if (l.applicationId) return "REGISTERED";
  if (l.formSentAt) return "SENT";
  return "UNSENT";
}

export const FORM_STATUS_LABEL: Record<FormStatus, string> = {
  UNSENT: "未送信",
  SENT: "送信",
  REGISTERED: "登録済み",
};

export const FORM_STATUS_BADGE: Record<FormStatus, string> = {
  UNSENT: "bg-text-muted/10 text-text-muted border-text-muted/20",
  SENT: "bg-status-warning/10 text-status-warning border-status-warning/20",
  REGISTERED: "bg-status-active/10 text-status-active border-status-active/20",
};

export default function LeadTable({ apiBase, hrefPrefix }: { apiBase: string; hrefPrefix: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiBase);
      const data = await res.json();
      if (res.ok) setLeads(data.leads);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = filter ? leads.filter((l) => l.callStatus === filter) : leads;

  return (
    <div>
      {/* ステータスフィルタ */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-text-muted mr-1">架電状況:</span>
          <FilterBtn current={filter} value="" label="全て" onClick={setFilter} />
          {Object.entries(LEAD_CALL_STATUS_LABELS).map(([k, v]) => (
            <FilterBtn key={k} current={filter} value={k} label={v} onClick={setFilter} />
          ))}
        </div>
        <span className="text-[11px] text-text-muted">{filtered.length} 件</span>
      </div>

      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-text-muted text-sm">読み込み中…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">リードはありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1280px]">
              <thead>
                <tr className="border-b border-border">
                  {["登録日", "ID", "紹介者", "氏名", "電話", "住所", "年収", "職業", "メール", "適合確認フォーム", "操作"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const formStatus = getFormStatus(l);
                  return (
                    <tr key={l.id} className="border-b border-border hover:bg-bg-primary/40 transition-colors">
                      <td className="px-4 py-3 text-[12px] text-text-muted whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleDateString("ja-JP")}
                      </td>
                      <td className="px-4 py-3 text-[12px] font-mono text-gold whitespace-nowrap">
                        {l.affiliateProfile.affiliateCode}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-text-primary whitespace-nowrap max-w-[160px] overflow-hidden text-ellipsis">
                        {l.affiliateProfile.user.name}
                        {l.affiliateProfile.displayName && (
                          <span className="text-[11px] text-text-muted ml-1">（{l.affiliateProfile.displayName}）</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-text-primary whitespace-nowrap">{l.name}</td>
                      <td className="px-4 py-3 text-[12px] text-text-primary font-mono whitespace-nowrap">{l.phone}</td>
                      <td className="px-4 py-3 text-[12px] text-text-muted whitespace-nowrap max-w-[220px] overflow-hidden text-ellipsis">
                        {l.address}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-text-primary whitespace-nowrap">{l.income || "---"}</td>
                      <td className="px-4 py-3 text-[12px] text-text-primary whitespace-nowrap">{l.occupation || "---"}</td>
                      <td className="px-4 py-3 text-[12px] text-text-primary whitespace-nowrap max-w-[220px] overflow-hidden text-ellipsis">
                        {l.email}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] border ${FORM_STATUS_BADGE[formStatus]}`}>
                          {FORM_STATUS_LABEL[formStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          href={`${hrefPrefix}/${l.id}`}
                          className="px-3 py-1 rounded border border-border text-[12px] text-text-primary hover:border-gold transition-colors"
                        >
                          詳細
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterBtn({
  current,
  value,
  label,
  onClick,
}: {
  current: string;
  value: string;
  label: string;
  onClick: (v: string) => void;
}) {
  const active = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-2.5 py-1 rounded text-[11px] border transition-colors ${
        active
          ? "border-gold text-gold bg-gold/10"
          : "border-border text-text-muted hover:text-text-primary"
      }`}
    >
      {label}
    </button>
  );
}
