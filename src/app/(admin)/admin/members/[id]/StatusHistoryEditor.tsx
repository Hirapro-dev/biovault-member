"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "REGISTERED", label: "メンバー登録済み" },
  { value: "TERMS_AGREED", label: "重要事項確認済み" },
  { value: "SERVICE_APPLIED", label: "iPSサービス申込済み" },
  { value: "SCHEDULE_ARRANGED", label: "日程調整中" },
  { value: "BLOOD_COLLECTED", label: "問診・採血完了" },
  { value: "IPS_CREATING", label: "iPS作製中" },
  { value: "STORAGE_ACTIVE", label: "iPS保管中" },
  { value: "STORAGE_EXPIRED", label: "保管期間満了" },
];

type Row = {
  fromStatus: string;
  toStatus: string;
  note: string;
  changedBy: string;
  changedAt: string; // YYYY-MM-DD
};

interface Props {
  userId: string;
  entries: {
    fromStatus: string;
    toStatus: string;
    note: string | null;
    changedBy: string;
    changedAt: string; // ISO
  }[];
}

export default function StatusHistoryEditor({ userId, entries }: Props) {
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rows, setRows] = useState<Row[]>(
    entries.map((e) => ({
      fromStatus: e.fromStatus,
      toStatus: e.toStatus,
      note: e.note || "",
      changedBy: e.changedBy,
      changedAt: e.changedAt.split("T")[0],
    })),
  );

  const ic = "w-full px-2 py-1.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-xs outline-none focus:border-border-gold";

  const addRow = () => {
    const last = rows[rows.length - 1];
    setRows([
      ...rows,
      {
        fromStatus: last?.toStatus || "REGISTERED",
        toStatus: "REGISTERED",
        note: "",
        changedBy: "全権限者編集",
        changedAt: "",
      },
    ]);
  };

  const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i));

  const updateRow = (i: number, patch: Partial<Row>) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // 日付未入力チェック
      if (rows.some((r) => !r.changedAt)) {
        setError("日付が未入力の行があります");
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/admin/members/${userId}/status-history`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: rows.map((r) => ({
            fromStatus: r.fromStatus,
            toStatus: r.toStatus,
            note: r.note,
            changedBy: r.changedBy,
            // JST基準の日付として送る
            changedAt: new Date(`${r.changedAt}T00:00:00+09:00`).toISOString(),
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "更新に失敗しました");
      } else {
        setSuccess("更新しました");
        setTimeout(() => {
          setShowPopup(false);
          setSuccess("");
          router.refresh();
        }, 1000);
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mt-3">
        <button
          onClick={() => { setError(""); setSuccess(""); setShowPopup(true); }}
          className="px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-sm text-xs hover:bg-red-500/20 transition-all cursor-pointer"
        >
          ステータス履歴を直接編集
        </button>
      </div>

      {showPopup && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowPopup(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-bg-secondary border border-red-500/30 rounded-xl p-5 sm:p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">全権限者専用</span>
            </div>
            <h3 className="font-serif-jp text-base text-gold tracking-wider mb-1">ステータス履歴の直接編集</h3>
            <p className="text-[10px] text-text-muted mb-4">タイムラインの各行を追加・編集・削除できます。保存すると履歴が置き換わります。</p>

            {success && <div className="mb-3 p-2 bg-status-active/10 border border-status-active/20 rounded text-status-active text-[11px]">{success}</div>}
            {error && <div className="mb-3 p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-[11px]">{error}</div>}

            <div className="space-y-2">
              {rows.length === 0 && (
                <div className="text-text-muted text-xs py-3 text-center">履歴がありません。「行を追加」で作成できます。</div>
              )}
              {rows.map((r, i) => (
                <div key={i} className="border border-border rounded-md p-3 bg-bg-elevated/40">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[9px] text-text-muted mb-1">日付</label>
                      <input type="date" value={r.changedAt} onChange={(e) => updateRow(i, { changedAt: e.target.value })} className={ic} />
                    </div>
                    <div>
                      <label className="block text-[9px] text-text-muted mb-1">変更前</label>
                      <select value={r.fromStatus} onChange={(e) => updateRow(i, { fromStatus: e.target.value })} className={ic + " cursor-pointer"}>
                        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-text-muted mb-1">変更後</label>
                      <select value={r.toStatus} onChange={(e) => updateRow(i, { toStatus: e.target.value })} className={ic + " cursor-pointer"}>
                        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-text-muted mb-1">変更者</label>
                      <input value={r.changedBy} onChange={(e) => updateRow(i, { changedBy: e.target.value })} className={ic} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-[9px] text-text-muted mb-1">メモ</label>
                      <input value={r.note} onChange={(e) => updateRow(i, { note: e.target.value })} className={ic} placeholder="（任意）" />
                    </div>
                    <button onClick={() => removeRow(i)} className="px-2 py-1.5 border border-red-500/30 text-red-400 rounded-sm text-[11px] hover:bg-red-500/10 cursor-pointer shrink-0">削除</button>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addRow} className="mt-3 px-3 py-2 border border-border-gold/40 text-gold rounded-sm text-xs hover:bg-gold/5 cursor-pointer">＋ 行を追加</button>

            <div className="flex gap-2 pt-4 mt-4 border-t border-border">
              <button onClick={() => setShowPopup(false)} className="px-4 py-2.5 border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold transition-all">キャンセル</button>
              <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50">
                {loading ? "更新中..." : "履歴を保存する"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
