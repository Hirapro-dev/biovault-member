"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

const PAYMENT_OPTIONS = [
  { value: "PENDING", label: "未入金" },
  { value: "COMPLETED", label: "入金済" },
];
const STATUS_OPTIONS = [
  { value: "APPLIED", label: "申込済" },
  { value: "PAYMENT_CONFIRMED", label: "入金済" },
  { value: "PRODUCING", label: "精製中" },
  { value: "CLINIC_BOOKING", label: "予約手配中" },
  { value: "INFORMED_AGREED", label: "同意済" },
  { value: "RESERVATION_CONFIRMED", label: "予約確定" },
  { value: "COMPLETED", label: "施術完了" },
];

type OrderForm = {
  id: string | null; // null = 新規
  planType: string;
  planLabel: string;
  totalAmount: number;
  paymentStatus: string;
  status: string;
  completedSessions: number;
  sessionDates: string; // カンマ区切り YYYY-MM-DD
  createdAt: string;
  paidAt: string;
  producedAt: string;
  storageStartedAt: string;
  expiresAt: string;
  completedAt: string;
  clinicDate: string;
  clinicName: string;
};

interface Props {
  userId: string;
  orders: {
    id: string;
    planType: string;
    planLabel: string;
    totalAmount: number;
    paymentStatus: string;
    status: string;
    completedSessions: number;
    sessionDates: string | null;
    createdAt: string;
    paidAt: string | null;
    producedAt: string | null;
    storageStartedAt: string | null;
    expiresAt: string | null;
    completedAt: string | null;
    clinicDate: string | null;
    clinicName: string | null;
  }[];
}

const ds = (iso: string | null | undefined) => (iso ? iso.split("T")[0] : "");
const toIso = (s: string) => (s ? new Date(`${s}T00:00:00+09:00`).toISOString() : null);

function toForm(o: Props["orders"][number]): OrderForm {
  let dates = "";
  try {
    dates = o.sessionDates ? (JSON.parse(o.sessionDates) as string[]).join(", ") : "";
  } catch { dates = ""; }
  return {
    id: o.id,
    planType: o.planType,
    planLabel: o.planLabel,
    totalAmount: o.totalAmount,
    paymentStatus: o.paymentStatus,
    status: o.status,
    completedSessions: o.completedSessions,
    sessionDates: dates,
    createdAt: ds(o.createdAt),
    paidAt: ds(o.paidAt),
    producedAt: ds(o.producedAt),
    storageStartedAt: ds(o.storageStartedAt),
    expiresAt: ds(o.expiresAt),
    completedAt: ds(o.completedAt),
    clinicDate: ds(o.clinicDate),
    clinicName: o.clinicName || "",
  };
}

const emptyForm = (): OrderForm => ({
  id: null,
  planType: "iv_drip_1",
  planLabel: "点滴1回分（10ml）",
  totalAmount: 880000,
  paymentStatus: "COMPLETED",
  status: "COMPLETED",
  completedSessions: 1,
  sessionDates: "",
  createdAt: "",
  paidAt: "",
  producedAt: "",
  storageStartedAt: "",
  expiresAt: "",
  completedAt: "",
  clinicDate: "",
  clinicName: "",
});

export default function CultureFluidFreeEditor({ userId, orders }: Props) {
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [forms, setForms] = useState<OrderForm[]>(orders.map(toForm));

  const ic = "w-full px-2 py-1.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-xs outline-none focus:border-border-gold";

  const update = (i: number, patch: Partial<OrderForm>) =>
    setForms(forms.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));

  const buildBody = (f: OrderForm) => ({
    planType: f.planType,
    planLabel: f.planLabel,
    totalAmount: Number(f.totalAmount) || 0,
    paymentStatus: f.paymentStatus,
    status: f.status,
    completedSessions: Number(f.completedSessions) || 0,
    sessionDates: f.sessionDates
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    createdAt: toIso(f.createdAt),
    paidAt: toIso(f.paidAt),
    producedAt: toIso(f.producedAt),
    storageStartedAt: toIso(f.storageStartedAt),
    expiresAt: toIso(f.expiresAt),
    completedAt: toIso(f.completedAt),
    clinicDate: toIso(f.clinicDate),
    clinicName: f.clinicName || null,
  });

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => { setSuccess(""); router.refresh(); }, 900);
  };

  const saveOrder = async (i: number) => {
    const f = forms[i];
    setLoading(true); setError(""); setSuccess("");
    try {
      const url = f.id
        ? `/api/admin/members/${userId}/culture-fluid/${f.id}`
        : `/api/admin/members/${userId}/culture-fluid`;
      const res = await fetch(url, {
        method: f.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(f)),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "保存に失敗しました");
      } else {
        flash(f.id ? "更新しました" : "作成しました");
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (i: number) => {
    const f = forms[i];
    if (!f.id) { setForms(forms.filter((_, idx) => idx !== i)); return; }
    if (!confirm("この注文を削除します。よろしいですか？")) return;
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch(`/api/admin/members/${userId}/culture-fluid/${f.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "削除に失敗しました");
      } else {
        flash("削除しました");
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const addForm = () => setForms([...forms, emptyForm()]);

  const dateField = (label: string, key: keyof OrderForm, i: number) => (
    <div>
      <label className="block text-[9px] text-text-muted mb-1">{label}</label>
      <input type="date" value={forms[i][key] as string} onChange={(e) => update(i, { [key]: e.target.value } as Partial<OrderForm>)} className={ic} />
    </div>
  );

  return (
    <>
      <div className="mt-3">
        <button
          onClick={() => { setError(""); setSuccess(""); setForms(orders.map(toForm)); setShowPopup(true); }}
          className="px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-sm text-xs hover:bg-red-500/20 transition-all cursor-pointer"
        >
          培養上清液を自由編集
        </button>
      </div>

      {showPopup && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowPopup(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-bg-secondary border border-red-500/30 rounded-xl p-5 sm:p-6 w-full max-w-3xl max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">全権限者専用</span>
            </div>
            <h3 className="font-serif-jp text-base text-gold tracking-wider mb-1">培養上清液 注文の自由編集</h3>
            <p className="text-[10px] text-text-muted mb-4">回数・施術日・金額・各日付・ステータスを直接編集できます。注文ごとに保存してください。施術日はカンマ区切り（例: 2026-04-29, 2026-05-18）。</p>

            {success && <div className="mb-3 p-2 bg-status-active/10 border border-status-active/20 rounded text-status-active text-[11px]">{success}</div>}
            {error && <div className="mb-3 p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-[11px]">{error}</div>}

            <div className="space-y-3">
              {forms.length === 0 && <div className="text-text-muted text-xs py-3 text-center">注文がありません。「注文を追加」で作成できます。</div>}
              {forms.map((f, i) => (
                <div key={f.id || `new-${i}`} className="border border-border rounded-md p-3 bg-bg-elevated/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-text-muted">{f.id ? `注文ID: ${f.id.slice(0, 8)}…` : "新規注文"}</span>
                    <button onClick={() => deleteOrder(i)} className="px-2 py-1 border border-red-500/30 text-red-400 rounded-sm text-[10px] hover:bg-red-500/10 cursor-pointer">削除</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] text-text-muted mb-1">プラン種別(planType)</label>
                      <input value={f.planType} onChange={(e) => update(i, { planType: e.target.value })} className={ic + " font-mono"} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] text-text-muted mb-1">表示ラベル</label>
                      <input value={f.planLabel} onChange={(e) => update(i, { planLabel: e.target.value })} className={ic} />
                    </div>
                    <div>
                      <label className="block text-[9px] text-text-muted mb-1">金額(税込)</label>
                      <input type="number" value={f.totalAmount} onChange={(e) => update(i, { totalAmount: Number(e.target.value) })} className={ic + " font-mono"} />
                    </div>
                    <div>
                      <label className="block text-[9px] text-text-muted mb-1">入金状況</label>
                      <select value={f.paymentStatus} onChange={(e) => update(i, { paymentStatus: e.target.value })} className={ic + " cursor-pointer"}>
                        {PAYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-text-muted mb-1">ステータス</label>
                      <select value={f.status} onChange={(e) => update(i, { status: e.target.value })} className={ic + " cursor-pointer"}>
                        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-text-muted mb-1">施術完了回数</label>
                      <input type="number" min={0} value={f.completedSessions} onChange={(e) => update(i, { completedSessions: Number(e.target.value) })} className={ic + " font-mono"} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] text-text-muted mb-1">施術日（カンマ区切り）</label>
                      <input value={f.sessionDates} onChange={(e) => update(i, { sessionDates: e.target.value })} className={ic + " font-mono"} placeholder="2026-04-29, 2026-05-18" />
                    </div>
                    {dateField("購入日(createdAt)", "createdAt", i)}
                    {dateField("入金日", "paidAt", i)}
                    {dateField("精製完了日", "producedAt", i)}
                    {dateField("管理保管開始日", "storageStartedAt", i)}
                    {dateField("管理期限", "expiresAt", i)}
                    {dateField("施術完了日", "completedAt", i)}
                    {dateField("クリニック予約日", "clinicDate", i)}
                    <div>
                      <label className="block text-[9px] text-text-muted mb-1">クリニック名</label>
                      <input value={f.clinicName} onChange={(e) => update(i, { clinicName: e.target.value })} className={ic} />
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button onClick={() => saveOrder(i)} disabled={loading} className="px-4 py-2 bg-gold-gradient border-none rounded-sm text-bg-primary text-[12px] font-semibold tracking-wider cursor-pointer disabled:opacity-50">
                      {f.id ? "この注文を更新" : "この注文を作成"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addForm} className="mt-3 px-3 py-2 border border-border-gold/40 text-gold rounded-sm text-xs hover:bg-gold/5 cursor-pointer">＋ 注文を追加</button>

            <div className="flex gap-2 pt-4 mt-4 border-t border-border">
              <button onClick={() => setShowPopup(false)} className="flex-1 py-2.5 border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold transition-all">閉じる</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
