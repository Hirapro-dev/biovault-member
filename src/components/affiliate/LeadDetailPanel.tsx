"use client";

/**
 * ご紹介協力リード詳細ページ（admin / staff 共用）
 * - 架電ステータスの更新（「繋がった」で適合確認フォームを自動メール送信）
 * - 架電メモの記録、案内メールの再送
 */

import { useState } from "react";
import Link from "next/link";
import { LEAD_CALL_STATUS_LABELS } from "@/lib/affiliate-labels";
import {
  type Lead,
  getFormStatus,
  FORM_STATUS_LABEL,
  FORM_STATUS_BADGE,
} from "./LeadTable";

export default function LeadDetailPanel({
  lead: initialLead,
  apiBase,
  backHref,
}: {
  lead: Lead;
  apiBase: string;
  backHref: string;
}) {
  const [lead, setLead] = useState(initialLead);
  const [status, setStatus] = useState(initialLead.callStatus);
  const [note, setNote] = useState(initialLead.callNote || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const patch = async (payload: Record<string, unknown>, successMsg: string) => {
    setMessage("");
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "更新に失敗しました");
        return;
      }
      setLead((prev) => ({ ...prev, ...payload } as Lead));
      setMessage(data.mailSent ? `${successMsg}（案内メールを送信しました）` : successMsg);
    } finally {
      setSaving(false);
    }
  };

  const save = () => patch({ callStatus: status, callNote: note }, "架電記録を更新しました");
  const resend = () => patch({ sendForm: true }, "案内メール再送しました");

  const formStatus = getFormStatus(lead);

  return (
    <div>
      <Link href={backHref} className="text-[12px] text-text-muted hover:text-gold">
        ← リード一覧へ戻る
      </Link>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mt-2 mb-5 sm:mb-7">
        {lead.name} さんのリード詳細
      </h2>

      <div className="bg-bg-secondary border border-border rounded-md p-6 max-w-2xl">
        <div className="flex flex-wrap items-center gap-1.5 mb-5">
          <span className={`px-2 py-0.5 rounded text-[11px] border ${FORM_STATUS_BADGE[formStatus]}`}>
            適合確認フォーム: {FORM_STATUS_LABEL[formStatus]}
          </span>
          {lead.isDuplicate && (
            <span className="px-2 py-0.5 rounded text-[11px] border bg-status-warning/10 text-status-warning border-status-warning/20">
              重複（報酬対象外）
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-[13px] mb-5">
          <InfoRow label="フリガナ" value={lead.nameKana} />
          <InfoRow label="電話番号" value={lead.phone} mono />
          <InfoRow label="メール" value={lead.email} />
          <InfoRow label="住所" value={lead.address} />
          <InfoRow label="職業" value={lead.occupation || "---"} />
          <InfoRow label="ご年収" value={lead.income || "---"} />
          <InfoRow
            label="紹介者"
            value={`${lead.affiliateProfile.affiliateCode} ${lead.affiliateProfile.user.name}${lead.affiliateProfile.displayName ? `（${lead.affiliateProfile.displayName}）` : ""}`}
          />
          <InfoRow
            label="最終架電"
            value={lead.calledAt ? `${new Date(lead.calledAt).toLocaleString("ja-JP")}${lead.staffCode ? ` (${lead.staffCode})` : ""}` : "---"}
          />
          <InfoRow
            label="フォーム送信"
            value={lead.formSentAt ? new Date(lead.formSentAt).toLocaleString("ja-JP") : "未送信"}
          />
        </div>

        {message && (
          <div className="mb-4 rounded border border-gold/30 bg-gold/5 px-4 py-2.5 text-[13px] text-gold">
            {message}
          </div>
        )}

        <div className="border-t border-border pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <div className="text-[11px] text-text-muted mb-1">架電結果</div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-bg-primary border border-border rounded px-2.5 py-1.5 text-[13px] text-text-primary"
              >
                {Object.entries(LEAD_CALL_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="text-[11px] text-text-muted mb-1">架電メモ</div>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="対応内容・次回予定など"
                className="w-full bg-bg-primary border border-border rounded px-2.5 py-1.5 text-[13px] text-text-primary"
              />
            </div>
          </div>
          {status === "CONNECTED" && lead.callStatus !== "CONNECTED" && !lead.applicationId && (
            <p className="mt-2 text-[11px] text-gold">
              ※「繋がった」で保存すると、適合確認フォームの案内メールが自動送信されます
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          {!lead.applicationId && lead.formSentAt && (
            <button
              onClick={resend}
              disabled={saving}
              className="px-4 py-2 rounded border border-border text-[13px] text-text-primary hover:border-gold transition-colors disabled:opacity-50"
            >
              案内メール再送
            </button>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded bg-gold/90 text-bg-primary text-[13px] font-bold hover:bg-gold transition-colors disabled:opacity-50"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="text-text-muted shrink-0 w-[90px]">{label}</span>
      <span className={`text-text-primary break-all ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
