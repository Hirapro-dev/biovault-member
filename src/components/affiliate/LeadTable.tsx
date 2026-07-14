"use client";

/**
 * ご紹介協力リード一覧（admin / staff 共用）
 * - 架電ステータスの更新（「繋がった」で適合確認フォームを自動メール送信）
 * - 架電メモの記録、案内メールの再送
 */

import { useCallback, useEffect, useState } from "react";
import {
  AFFILIATE_CHANNEL_LABELS,
  LEAD_CALL_STATUS_LABELS,
} from "@/lib/affiliate-labels";

type Lead = {
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

const STATUS_BADGE: Record<string, string> = {
  UNCALLED: "bg-text-muted/10 text-text-muted border-text-muted/20",
  CONNECTED: "bg-status-active/10 text-status-active border-status-active/20",
  NO_ANSWER: "bg-status-warning/10 text-status-warning border-status-warning/20",
  RECALL: "bg-status-warning/10 text-status-warning border-status-warning/20",
  INVALID: "bg-text-muted/10 text-text-muted border-text-muted/20",
};

export default function LeadTable({ apiBase }: { apiBase: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [message, setMessage] = useState("");

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

  const patch = async (id: string, payload: Record<string, unknown>, successMsg: string) => {
    setMessage("");
    const res = await fetch(`${apiBase}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "更新に失敗しました");
      return;
    }
    setMessage(data.mailSent ? `${successMsg}（案内メールを送信しました）` : successMsg);
    await load();
    // モーダル表示中のレコードも最新化する
    setDetailLead((prev) => (prev && prev.id === id ? { ...prev, ...payload } as Lead : prev));
  };

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

      {message && (
        <div className="mb-4 rounded border border-gold/30 bg-gold/5 px-4 py-2.5 text-[13px] text-gold">
          {message}
        </div>
      )}

      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-text-muted text-sm">読み込み中…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">リードはありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1180px]">
              <thead>
                <tr className="border-b border-border">
                  {["登録日", "氏名", "フリガナ", "電話", "メール", "住所", "紹介者", "架電状況", "ステータス", "操作"].map(
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
                {filtered.map((l) => (
                  <tr key={l.id} className="border-b border-border hover:bg-bg-primary/40 transition-colors">
                    <td className="px-4 py-3 text-[12px] text-text-muted whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-text-primary whitespace-nowrap">{l.name}</td>
                    <td className="px-4 py-3 text-[12px] text-text-muted whitespace-nowrap">{l.nameKana}</td>
                    <td className="px-4 py-3 text-[12px] text-text-primary font-mono whitespace-nowrap">{l.phone}</td>
                    <td className="px-4 py-3 text-[12px] text-text-primary whitespace-nowrap max-w-[220px] overflow-hidden text-ellipsis">
                      {l.email}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-text-muted whitespace-nowrap max-w-[220px] overflow-hidden text-ellipsis">
                      {l.address}
                    </td>
                    <td className="px-4 py-3 text-[12px] whitespace-nowrap">
                      <span className="font-mono text-gold mr-1.5">{l.affiliateProfile.affiliateCode}</span>
                      <span className="text-text-primary">{l.affiliateProfile.user.name}</span>
                      <span className="text-[11px] text-text-muted ml-1.5">
                        {AFFILIATE_CHANNEL_LABELS[l.affiliateProfile.channel]}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] border ${STATUS_BADGE[l.callStatus] || ""}`}>
                        {LEAD_CALL_STATUS_LABELS[l.callStatus] || l.callStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap space-x-1">
                      {l.applicationId && (
                        <span className="px-2 py-0.5 rounded text-[11px] border bg-status-active/10 text-status-active border-status-active/20">
                          適合確認 申請済み
                        </span>
                      )}
                      {l.isDuplicate && (
                        <span className="px-2 py-0.5 rounded text-[11px] border bg-status-warning/10 text-status-warning border-status-warning/20">
                          重複
                        </span>
                      )}
                      {!l.applicationId && !l.isDuplicate && <span className="text-text-muted">---</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => setDetailLead(l)}
                        className="px-3 py-1 rounded border border-border text-[12px] text-text-primary hover:border-gold transition-colors"
                      >
                        詳細
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailLead && (
        <LeadDetailModal lead={detailLead} onPatch={patch} onClose={() => setDetailLead(null)} />
      )}
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

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="text-text-muted shrink-0 w-[90px]">{label}</span>
      <span className={`text-text-primary break-all ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

// リード詳細・架電記録の編集モーダル
function LeadDetailModal({
  lead,
  onPatch,
  onClose,
}: {
  lead: Lead;
  onPatch: (id: string, payload: Record<string, unknown>, successMsg: string) => Promise<void>;
  onClose: () => void;
}) {
  const [status, setStatus] = useState(lead.callStatus);
  const [note, setNote] = useState(lead.callNote || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onPatch(lead.id, { callStatus: status, callNote: note }, "架電記録を更新しました");
    } finally {
      setSaving(false);
    }
  };

  const resend = async () => {
    setSaving(true);
    try {
      await onPatch(lead.id, { sendForm: true }, "案内メールを再送しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-md border border-border bg-bg-secondary p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[15px] text-text-primary mb-4">{lead.name} さんのリード詳細</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-[13px] mb-5">
          <InfoRow label="フリガナ" value={lead.nameKana} />
          <InfoRow label="電話番号" value={lead.phone} mono />
          <InfoRow label="メール" value={lead.email} />
          <InfoRow label="住所" value={lead.address} />
          <InfoRow label="職業" value={lead.occupation || "---"} />
          <InfoRow label="ご年収" value={lead.income || "---"} />
          <InfoRow
            label="紹介者"
            value={`${lead.affiliateProfile.user.name}${lead.affiliateProfile.displayName ? `（${lead.affiliateProfile.displayName}）` : ""}`}
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
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded border border-border text-[13px] text-text-primary hover:border-gold disabled:opacity-50"
          >
            閉じる
          </button>
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
