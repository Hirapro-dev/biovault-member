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
  const [expanded, setExpanded] = useState<string | null>(null);
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
  };

  const filtered = filter ? leads.filter((l) => l.callStatus === filter) : leads;

  return (
    <div>
      {/* ステータスフィルタ */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[11px] text-text-muted mr-1">架電状況:</span>
        <FilterBtn current={filter} value="" label="全て" onClick={setFilter} />
        {Object.entries(LEAD_CALL_STATUS_LABELS).map(([k, v]) => (
          <FilterBtn key={k} current={filter} value={k} label={v} onClick={setFilter} />
        ))}
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
          <div className="divide-y divide-border">
            {filtered.map((l) => (
              <div key={l.id}>
                {/* 行サマリー */}
                <button
                  onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                  className="w-full px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-left hover:bg-bg-primary/40 transition-colors"
                >
                  <span className="text-[13px] text-text-primary font-medium min-w-[110px]">{l.name}</span>
                  <span className="font-mono text-[12px] text-gold">{l.affiliateProfile.affiliateCode}</span>
                  <span className="text-[11px] text-text-muted">
                    {AFFILIATE_CHANNEL_LABELS[l.affiliateProfile.channel]}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] border ${STATUS_BADGE[l.callStatus] || ""}`}
                  >
                    {LEAD_CALL_STATUS_LABELS[l.callStatus] || l.callStatus}
                  </span>
                  {l.applicationId && (
                    <span className="px-2 py-0.5 rounded text-[11px] border bg-status-active/10 text-status-active border-status-active/20">
                      適合確認 申請済み
                    </span>
                  )}
                  {l.isDuplicate && (
                    <span className="px-2 py-0.5 rounded text-[11px] border bg-status-warning/10 text-status-warning border-status-warning/20">
                      重複（報酬対象外）
                    </span>
                  )}
                  <span className="ml-auto text-[11px] text-text-muted">
                    {new Date(l.createdAt).toLocaleDateString("ja-JP")}
                  </span>
                </button>

                {/* 詳細 + 操作 */}
                {expanded === l.id && (
                  <div className="px-4 pb-4 pt-1 bg-bg-primary/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-[13px] mb-4">
                      <InfoRow label="フリガナ" value={l.nameKana} />
                      <InfoRow label="電話番号" value={l.phone} mono />
                      <InfoRow label="メール" value={l.email} />
                      <InfoRow label="住所" value={l.address} />
                      <InfoRow label="職業" value={l.occupation || "---"} />
                      <InfoRow label="ご年収" value={l.income || "---"} />
                      <InfoRow
                        label="紹介者"
                        value={`${l.affiliateProfile.user.name}${l.affiliateProfile.displayName ? `（${l.affiliateProfile.displayName}）` : ""}`}
                      />
                      <InfoRow
                        label="最終架電"
                        value={l.calledAt ? `${new Date(l.calledAt).toLocaleString("ja-JP")}${l.staffCode ? ` (${l.staffCode})` : ""}` : "---"}
                      />
                      <InfoRow
                        label="フォーム送信"
                        value={l.formSentAt ? new Date(l.formSentAt).toLocaleString("ja-JP") : "未送信"}
                      />
                    </div>

                    <LeadActions lead={l} onPatch={patch} />
                  </div>
                )}
              </div>
            ))}
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

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="text-text-muted shrink-0 w-[90px]">{label}</span>
      <span className={`text-text-primary break-all ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

// 架電記録の操作パネル
function LeadActions({
  lead,
  onPatch,
}: {
  lead: Lead;
  onPatch: (id: string, payload: Record<string, unknown>, successMsg: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(lead.callStatus);
  const [note, setNote] = useState(lead.callNote || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onPatch(
        lead.id,
        { callStatus: status, callNote: note },
        "架電記録を更新しました"
      );
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
    <div className="border-t border-border pt-3">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <div className="text-[11px] text-text-muted mb-1">架電結果</div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-bg-secondary border border-border rounded px-2.5 py-1.5 text-[13px] text-text-primary"
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
            className="w-full bg-bg-secondary border border-border rounded px-2.5 py-1.5 text-[13px] text-text-primary"
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-1.5 rounded bg-gold/90 text-bg-primary text-[13px] font-bold hover:bg-gold transition-colors disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存"}
        </button>
        {!lead.applicationId && lead.formSentAt && (
          <button
            onClick={resend}
            disabled={saving}
            className="px-4 py-1.5 rounded border border-border text-[13px] text-text-primary hover:border-gold transition-colors disabled:opacity-50"
          >
            案内メール再送
          </button>
        )}
      </div>
      {status === "CONNECTED" && lead.callStatus !== "CONNECTED" && !lead.applicationId && (
        <p className="mt-2 text-[11px] text-gold">
          ※「繋がった」で保存すると、適合確認フォームの案内メールが自動送信されます
        </p>
      )}
    </div>
  );
}
