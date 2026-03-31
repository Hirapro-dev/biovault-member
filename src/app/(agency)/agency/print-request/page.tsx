"use client";

import { useState, useEffect } from "react";

interface PrintReq {
  id: string; companyName: string; quantity: number; shippingAddress: string;
  paymentMethod: string; status: string; bankInfo: string | null;
  confirmedAt: string | null; paidAt: string | null; orderedAt: string | null;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  REQUESTED: { label: "申請", color: "bg-status-warning/10 text-status-warning border-status-warning/20" },
  CONFIRMED: { label: "本部確認済", color: "bg-gold/10 text-gold border-gold/20" },
  AWAITING_PAYMENT: { label: "入金待ち", color: "bg-status-info/10 text-status-info border-status-info/20" },
  PAID: { label: "入金確認済", color: "bg-gold/10 text-gold border-gold/20" },
  ORDERED: { label: "本部発注済", color: "bg-status-active/10 text-status-active border-status-active/20" },
  CANCELLED: { label: "キャンセル", color: "bg-text-muted/10 text-text-muted border-text-muted/20" },
};

export default function PrintRequestPage() {
  const [form, setForm] = useState({ companyName: "", representativeName: "", quantity: 100, postalCode: "", shippingAddress: "", paymentMethod: "cod", note: "" });
  const [requests, setRequests] = useState<PrintReq[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchRequests = async () => {
    const res = await fetch("/api/agency/print-request");
    const data = await res.json();
    if (Array.isArray(data)) setRequests(data);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setMessage(""); setError("");
    try {
      const res = await fetch("/api/agency/print-request", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (res.ok) {
        setMessage("印刷依頼を送信しました");
        setForm({ companyName: "", representativeName: "", quantity: 100, postalCode: "", shippingAddress: "", paymentMethod: "cod", note: "" });
        setShowForm(false);
        fetchRequests();
      } else { const d = await res.json(); setError(d.error || "送信に失敗しました"); }
    } catch { setError("エラーが発生しました"); }
    finally { setSubmitting(false); }
  };

  const ic = "w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors focus:border-border-gold";

  return (
    <div>
      <div className="flex justify-between items-center mb-5 sm:mb-7">
        <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px]">パンフレット印刷依頼</h2>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-xs sm:text-[13px] font-semibold tracking-wider cursor-pointer">
          {showForm ? "✕ 閉じる" : "+ 新規申請"}
        </button>
      </div>

      {message && <div className="mb-4 p-3 bg-status-active/10 border border-status-active/20 rounded text-status-active text-xs">{message}</div>}
      {error && <div className="mb-4 p-3 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-xs">{error}</div>}

      {/* 申請フォーム */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-bg-secondary border border-border-gold rounded-md p-5 sm:p-7 mb-6">
          <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-5 pb-3 border-b border-border">新規申請</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div><label className="block text-xs text-text-secondary mb-2">代理店名 <span className="text-status-danger">*</span></label><input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required className={ic} /></div>
            <div><label className="block text-xs text-text-secondary mb-2">代表者名 <span className="text-status-danger">*</span></label><input value={form.representativeName} onChange={(e) => setForm({ ...form, representativeName: e.target.value })} required className={ic} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-text-secondary mb-2">部数 <span className="text-status-danger">*</span></label>
              <select value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className={ic + " cursor-pointer"}>
                {[100,200,300,400,500,600,700,800,900,1000].map((n) => <option key={n} value={n}>{n}部</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-2">支払方法 <span className="text-status-danger">*</span></label>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className={ic + " cursor-pointer"}>
                <option value="cod">代引き</option>
                <option value="bank_transfer">銀行振込</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div><label className="block text-xs text-text-secondary mb-2">郵便番号</label><input inputMode="numeric" value={form.postalCode} onChange={(e) => { const d=e.target.value.replace(/[^0-9]/g,"").slice(0,7); setForm({...form, postalCode: d.length>3 ? d.slice(0,3)+"-"+d.slice(3) : d}); }} placeholder="000-0000" maxLength={8} className={ic+" font-mono"} /></div>
            <div className="sm:col-span-2"><label className="block text-xs text-text-secondary mb-2">送り先住所 <span className="text-status-danger">*</span></label><input value={form.shippingAddress} onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })} required className={ic} /></div>
          </div>
          <div className="mb-5"><label className="block text-xs text-text-secondary mb-2">備考</label><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} className={ic+" resize-none"} /></div>
          <button type="submit" disabled={submitting} className="w-full py-3 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50">
            {submitting ? "送信中..." : "印刷を申請する"}
          </button>
        </form>
      )}

      {/* 申請履歴 */}
      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {requests.length === 0 ? (
          <div className="py-10 text-center text-text-muted text-sm">申請履歴はありません</div>
        ) : (
          <div className="divide-y divide-border">
            {requests.map((r) => {
              const st = STATUS_MAP[r.status] || STATUS_MAP.REQUESTED;
              const isBankTransfer = r.paymentMethod === "bank_transfer";
              return (
                <div key={r.id} className="px-4 sm:px-5 py-4">
                  {/* ヘッダー */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm text-text-primary font-medium">{r.quantity}部 — {isBankTransfer ? "銀行振込" : "代引き"}</div>
                      <div className="text-[11px] text-text-muted mt-0.5">{new Date(r.createdAt).toLocaleDateString("ja-JP")} 申請</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                  </div>

                  {/* 進捗タイムライン */}
                  <div className="flex items-center gap-1 mb-3">
                    {isBankTransfer ? (
                      <>
                        <Step label="申請" done={true} />
                        <Line done={!!r.confirmedAt} />
                        <Step label="本部確認" done={!!r.confirmedAt} />
                        <Line done={!!r.paidAt} />
                        <Step label="入金" done={!!r.paidAt} />
                        <Line done={!!r.orderedAt} />
                        <Step label="発注済" done={!!r.orderedAt} />
                      </>
                    ) : (
                      <>
                        <Step label="申請" done={true} />
                        <Line done={!!r.confirmedAt} />
                        <Step label="本部確認" done={!!r.confirmedAt} />
                        <Line done={!!r.orderedAt} />
                        <Step label="発注済" done={!!r.orderedAt} />
                      </>
                    )}
                  </div>

                  {/* 銀行振込の場合: 振込先表示 */}
                  {isBankTransfer && r.bankInfo && (r.status === "AWAITING_PAYMENT") && (
                    <div className="bg-bg-elevated border border-border-gold rounded-md p-3 mb-2">
                      <div className="text-[11px] text-gold mb-1">振込先情報</div>
                      <div className="text-xs text-text-primary whitespace-pre-wrap">{r.bankInfo}</div>
                    </div>
                  )}

                  <div className="text-[11px] text-text-muted">送り先: {r.shippingAddress}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Step({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] ${done ? "bg-gold text-bg-primary" : "bg-bg-elevated text-text-muted border border-border"}`}>
        {done ? "✓" : ""}
      </div>
      <div className={`text-[9px] mt-1 ${done ? "text-gold" : "text-text-muted"}`}>{label}</div>
    </div>
  );
}

function Line({ done }: { done: boolean }) {
  return <div className={`flex-1 h-[2px] mt-[-12px] ${done ? "bg-gold" : "bg-border"}`} />;
}
