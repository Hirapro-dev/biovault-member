"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Req {
  id: string; agencyCode: string; companyName: string; representativeName: string;
  quantity: number; postalCode: string | null; shippingAddress: string;
  paymentMethod: string; note: string | null; status: string;
  bankInfo: string | null; adminNote: string | null;
  confirmedAt: string | null; paidAt: string | null; orderedAt: string | null; createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  REQUESTED: { label: "申請", color: "bg-status-warning/10 text-status-warning border-status-warning/20" },
  CONFIRMED: { label: "本部確認済", color: "bg-gold/10 text-gold border-gold/20" },
  AWAITING_PAYMENT: { label: "入金待ち", color: "bg-status-info/10 text-status-info border-status-info/20" },
  PAID: { label: "入金確認済", color: "bg-gold/10 text-gold border-gold/20" },
  ORDERED: { label: "本部発注済", color: "bg-status-active/10 text-status-active border-status-active/20" },
  CANCELLED: { label: "キャンセル", color: "bg-text-muted/10 text-text-muted border-text-muted/20" },
};

export default function PrintRequestCard({ request: r }: { request: Req }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bankInfo, setBankInfo] = useState(r.bankInfo || "");
  const [adminNote, setAdminNote] = useState(r.adminNote || "");
  const st = STATUS_MAP[r.status] || STATUS_MAP.REQUESTED;
  const isBankTransfer = r.paymentMethod === "bank_transfer";

  const handleAction = async (action: string) => {
    setLoading(true);
    await fetch(`/api/admin/print-requests/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, bankInfo, adminNote, paymentMethod: r.paymentMethod }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[13px] text-gold">{r.agencyCode}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-bg-elevated text-text-secondary border-border">
              {isBankTransfer ? "銀行振込" : "代引き"}
            </span>
          </div>
          <div className="text-sm text-text-primary">{r.companyName}（{r.representativeName}）</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg text-gold">{r.quantity}部</div>
          <div className="text-[11px] text-text-muted">{new Date(r.createdAt).toLocaleDateString("ja-JP")}</div>
        </div>
      </div>

      {/* 詳細 */}
      <div className="text-xs text-text-secondary mb-3">送り先: 〒{r.postalCode || "---"} {r.shippingAddress}</div>
      {r.note && <div className="text-xs text-text-muted mb-3">備考: {r.note}</div>}

      {/* 進捗タイムライン */}
      <div className="flex items-center gap-1 mb-4">
        <Dot done label="申請" date={r.createdAt} />
        <Ln done={!!r.confirmedAt} />
        <Dot done={!!r.confirmedAt} label="本部確認" date={r.confirmedAt} />
        {isBankTransfer && (<><Ln done={!!r.paidAt} /><Dot done={!!r.paidAt} label="入金" date={r.paidAt} /></>)}
        <Ln done={!!r.orderedAt} />
        <Dot done={!!r.orderedAt} label="発注済" date={r.orderedAt} />
      </div>

      {/* アクションボタン */}
      <div className="border-t border-border pt-3 space-y-3">
        {/* 1. 本部確認 */}
        {r.status === "REQUESTED" && (
          <div>
            {isBankTransfer && (
              <div className="mb-2">
                <label className="block text-xs text-text-secondary mb-1">振込先情報（エージェントに表示されます）</label>
                <textarea value={bankInfo} onChange={(e) => setBankInfo(e.target.value)} placeholder="銀行名 / 支店名 / 口座種別 / 口座番号 / 口座名義" rows={2} className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-sm text-text-primary text-xs outline-none resize-none" />
              </div>
            )}
            <button onClick={() => handleAction("confirm")} disabled={loading || (isBankTransfer && !bankInfo)} className="px-4 py-2 bg-gold-gradient text-bg-primary text-xs font-semibold rounded-sm cursor-pointer disabled:opacity-50">
              {loading ? "..." : "✓ 本部確認済みにする"}
            </button>
          </div>
        )}

        {/* 2. 入金確認（銀行振込の場合） */}
        {r.status === "AWAITING_PAYMENT" && (
          <button onClick={() => handleAction("paid")} disabled={loading} className="px-4 py-2 bg-gold-gradient text-bg-primary text-xs font-semibold rounded-sm cursor-pointer disabled:opacity-50">
            {loading ? "..." : "✓ 入金確認済みにする"}
          </button>
        )}

        {/* 3. 本部発注済 */}
        {(r.status === "CONFIRMED" || r.status === "PAID") && (
          <button onClick={() => handleAction("ordered")} disabled={loading} className="px-4 py-2 bg-status-active text-white text-xs font-semibold rounded-sm cursor-pointer disabled:opacity-50">
            {loading ? "..." : "✓ 本部発注済みにする"}
          </button>
        )}

        {/* キャンセル */}
        {r.status !== "ORDERED" && r.status !== "CANCELLED" && (
          <button onClick={() => handleAction("cancel")} disabled={loading} className="px-3 py-1.5 bg-transparent border border-border text-text-muted rounded-sm text-[11px] cursor-pointer hover:text-status-danger hover:border-status-danger/50 transition-all">
            キャンセル
          </button>
        )}

        {/* メモ */}
        <div className="flex gap-2">
          <input value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="管理者メモ" className="flex-1 px-3 py-1.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-xs outline-none" />
          <button onClick={() => handleAction("note")} disabled={loading} className="px-3 py-1.5 bg-transparent border border-border text-text-secondary rounded-sm text-[11px] cursor-pointer hover:border-border-gold hover:text-gold transition-all">
            メモ保存
          </button>
        </div>
      </div>
    </div>
  );
}

function Dot({ done, label, date }: { done: boolean; label: string; date: string | null }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] ${done ? "bg-gold text-bg-primary" : "bg-bg-elevated text-text-muted border border-border"}`}>
        {done ? "✓" : ""}
      </div>
      <div className={`text-[9px] mt-1 ${done ? "text-gold" : "text-text-muted"}`}>{label}</div>
      {done && date && <div className="text-[8px] text-text-muted">{new Date(date).toLocaleDateString("ja-JP")}</div>}
    </div>
  );
}

function Ln({ done }: { done: boolean }) {
  return <div className={`flex-1 h-[2px] mt-[-20px] ${done ? "bg-gold" : "bg-border"}`} />;
}
