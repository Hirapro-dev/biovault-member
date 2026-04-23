"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";

type Commission = {
  id: string;
  memberName: string;
  memberNumber: string;
  saleAmount: number;
  commissionRate: number;
  commissionAmount: number;
  staffCommissionRate: number;
  staffCommissionAmount: number;
  staffCode: string | null;
  contributionType: string;
  status: string;
  note: string | null;
  sourceType: string | null;
  paidAt: Date | null;
  createdAt: Date;
};

const STATUS_MAP: Record<string, { label: string; variant: "gold" | "success" | "warning" | "muted" }> = {
  PENDING: { label: "未確定", variant: "warning" },
  CONFIRMED: { label: "確定", variant: "gold" },
  PAID: { label: "支払済", variant: "success" },
  CANCELLED: { label: "取消", variant: "muted" },
};

export default function CommissionList({
  agencyProfileId,
  commissions,
}: {
  agencyProfileId: string;
  commissions: Commission[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Commission | null>(null);
  const [form, setForm] = useState({ commissionRate: "", staffCommissionRate: "", status: "", contributionType: "" });
  const [saving, setSaving] = useState(false);

  const openEdit = (c: Commission) => {
    setEditing(c);
    setForm({
      commissionRate: String(c.commissionRate),
      staffCommissionRate: String(c.staffCommissionRate ?? 0),
      status: c.status,
      contributionType: c.contributionType || "",
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setSaving(false);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/agencies/${agencyProfileId}/commissions/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commissionRate: parseFloat(form.commissionRate),
          staffCommissionRate: parseFloat(form.staffCommissionRate),
          status: form.status,
          contributionType: form.contributionType,
        }),
      });
      if (!res.ok) throw new Error("更新失敗");
      router.refresh();
      closeEdit();
    } catch (e) {
      console.error(e);
      alert("更新に失敗しました");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    if (!confirm(`${editing.memberName}（${editing.memberNumber}）の報酬レコードを削除しますか?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/agencies/${agencyProfileId}/commissions/${editing.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("削除失敗");
      router.refresh();
      closeEdit();
    } catch (e) {
      console.error(e);
      alert("削除に失敗しました");
      setSaving(false);
    }
  };

  const ic = "w-full px-3 py-2 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none focus:border-border-gold";

  const previewAgency = editing ? Math.floor((editing.saleAmount * (parseFloat(form.commissionRate) || 0)) / 100) : 0;
  const previewStaff = editing ? Math.floor((editing.saleAmount * (parseFloat(form.staffCommissionRate) || 0)) / 100) : 0;

  return (
    <>
      <div className="mt-6 bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
          報酬履歴 ({commissions.length}件)
        </h3>
        {commissions.length === 0 ? (
          <div className="text-text-muted text-sm py-4 text-center">報酬記録なし</div>
        ) : (
          <div className="divide-y divide-border">
            {commissions.map((c) => {
              const st = STATUS_MAP[c.status] || STATUS_MAP.PENDING;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openEdit(c)}
                  className="w-full flex items-center justify-between py-3 text-left hover:bg-bg-elevated/40 transition-colors cursor-pointer px-2 -mx-2 rounded"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-text-primary flex items-center gap-2 flex-wrap">
                      {c.memberName}（{c.memberNumber}）
                      {c.sourceType && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-gold/10 text-gold border border-gold/20">
                          自動 {c.sourceType}
                        </span>
                      )}
                    </div>
                    {c.note && <div className="text-[11px] text-gold mt-0.5 truncate">{c.note}</div>}
                    <div className="text-[11px] text-text-muted mt-0.5">
                      {c.contributionType || "備考なし"} ・ 売上 ¥{c.saleAmount.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-text-muted mt-0.5 font-mono">
                      代理店 {c.commissionRate}% = ¥{c.commissionAmount.toLocaleString()}
                      {(c.staffCommissionRate ?? 0) > 0 && (
                        <span className="ml-2 text-gold">／ 営業マン {c.staffCommissionRate}% = ¥{c.staffCommissionAmount.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="font-mono text-sm text-gold">¥{(c.commissionAmount + (c.staffCommissionAmount ?? 0)).toLocaleString()}</span>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      {editing && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={closeEdit}
        >
          <div
            className="bg-bg-secondary border border-border rounded-md p-5 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">
              報酬レコードを編集
            </h3>

            <div className="mb-4 text-[12px] text-text-secondary">
              <div>{editing.memberName}（{editing.memberNumber}）</div>
              <div className="text-text-muted text-[11px] mt-1">
                売上 ¥{editing.saleAmount.toLocaleString()}
                {editing.note && <span className="ml-2 text-gold">{editing.note}</span>}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">代理店報酬率(%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.commissionRate}
                  onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
                  className={ic + " font-mono"}
                />
                <div className="text-[11px] text-gold font-mono mt-1">
                  代理店報酬: ¥{previewAgency.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1">営業マン報酬率(%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.staffCommissionRate}
                  onChange={(e) => setForm({ ...form, staffCommissionRate: e.target.value })}
                  className={ic + " font-mono"}
                />
                <div className="text-[11px] text-gold font-mono mt-1">
                  営業マン報酬: ¥{previewStaff.toLocaleString()}
                </div>
                {editing.staffCode && (
                  <div className="text-[10px] text-text-muted mt-1">営業マン: {editing.staffCode}</div>
                )}
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1">ステータス</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={ic + " cursor-pointer"}
                >
                  <option value="PENDING">未確定</option>
                  <option value="CONFIRMED">確定</option>
                  <option value="PAID">支払済</option>
                  <option value="CANCELLED">取消</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1">備考</label>
                <input
                  type="text"
                  value={form.contributionType}
                  onChange={(e) => setForm({ ...form, contributionType: e.target.value })}
                  placeholder="自由記入"
                  className={ic}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2 bg-gold-gradient text-bg-primary text-xs font-semibold rounded-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? "..." : "保存"}
                </button>
                <button
                  onClick={closeEdit}
                  disabled={saving}
                  className="px-4 py-2 border border-border text-text-secondary rounded-sm text-xs cursor-pointer disabled:opacity-50"
                >
                  取消
                </button>
              </div>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="w-full py-2 border border-status-danger/40 text-status-danger text-[11px] rounded-sm cursor-pointer disabled:opacity-50 hover:bg-status-danger/5 transition-colors"
              >
                このレコードを削除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
