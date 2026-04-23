"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * 管理者用: 代理店の基本情報・契約情報を編集可能にする
 * - エージェントコードは読み取り専用（会員紐付けが壊れるため）
 * - 報酬率は「合計率」と「営業マン取り分」の2値で管理
 */
export default function AgencyInfoEditor({
  userId,
  agencyProfileId,
  initial,
}: {
  userId: string;
  agencyProfileId: string;
  initial: {
    companyName: string;
    representativeName: string;
    nameKana: string;
    loginId: string;
    email: string;
    phone: string;
    address: string;
    agencyCode: string;
    commissionRate: number;       // 合計
    staffCommissionRate: number;  // 営業マン取り分
    bankName: string;
    bankBranch: string;
    bankAccountType: string;
    bankAccountNumber: string;
    bankAccountName: string;
  };
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [f, setF] = useState({ ...initial, commissionRate: String(initial.commissionRate), staffCommissionRate: String(initial.staffCommissionRate) });

  const totalRate = parseFloat(f.commissionRate) || 0;
  const staffRate = parseFloat(f.staffCommissionRate) || 0;
  const agencyRate = Math.max(0, totalRate - staffRate);

  const save = async () => {
    setSaving(true);
    try {
      // ユーザー基本情報
      const userRes = await fetch(`/api/admin/agencies/${userId}/user-info`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.representativeName,
          nameKana: f.nameKana,
          email: f.email,
          phone: f.phone,
          address: f.address,
        }),
      });
      if (!userRes.ok) throw new Error("ユーザー情報の更新失敗");

      // 代理店プロフィール（契約情報・報酬率・振込先）
      const profileRes = await fetch(`/api/admin/agencies/${agencyProfileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: f.companyName,
          representativeName: f.representativeName,
          commissionRate: totalRate,
          staffCommissionRate: staffRate,
          bankName: f.bankName,
          bankBranch: f.bankBranch,
          bankAccountType: f.bankAccountType,
          bankAccountNumber: f.bankAccountNumber,
          bankAccountName: f.bankAccountName,
        }),
      });
      if (!profileRes.ok) throw new Error("プロフィール更新失敗");

      setMsg("更新しました");
      setEditing(false);
      router.refresh();
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      console.error(e);
      alert("更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setF({ ...initial, commissionRate: String(initial.commissionRate), staffCommissionRate: String(initial.staffCommissionRate) });
    setEditing(false);
  };

  const ic = "w-full px-3 py-2 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none focus:border-border-gold";

  if (!editing) {
    return (
      <>
        {msg && (
          <div className="mb-3 p-2 bg-status-active/10 border border-status-active/20 rounded text-status-active text-[11px]">
            {msg}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5">
          <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider">基本情報</h3>
              <button
                onClick={() => setEditing(true)}
                className="text-[10px] px-2 py-1 border border-border rounded-sm text-gold hover:bg-bg-elevated cursor-pointer"
              >
                編集
              </button>
            </div>
            <Row label="法人名/屋号" value={initial.companyName || "---"} />
            <Row label="代表者名" value={initial.representativeName || "---"} />
            <Row label="フリガナ" value={initial.nameKana || "---"} />
            <Row label="ログインID" value={initial.loginId} mono />
            <Row label="メール" value={initial.email || "---"} />
            <Row label="電話番号" value={initial.phone || "---"} />
            <Row label="住所" value={initial.address || "---"} />
          </div>

          <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider">契約情報</h3>
              <button
                onClick={() => setEditing(true)}
                className="text-[10px] px-2 py-1 border border-border rounded-sm text-gold hover:bg-bg-elevated cursor-pointer"
              >
                編集
              </button>
            </div>
            <Row label="エージェントコード" value={initial.agencyCode} mono />
            <Row
              label="報酬率"
              value={`営業マン ${initial.staffCommissionRate}% ／ 代理店 ${Math.max(0, initial.commissionRate - initial.staffCommissionRate)}% （合計 ${initial.commissionRate}%）`}
            />
            <Row label="銀行名" value={initial.bankName || "未登録"} />
            <Row label="支店名" value={initial.bankBranch || "未登録"} />
            <Row label="口座種別" value={initial.bankAccountType || "未登録"} />
            <Row label="口座番号" value={initial.bankAccountNumber || "未登録"} mono />
            <Row label="口座名義" value={initial.bankAccountName || "未登録"} />
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5">
      <div className="bg-bg-secondary border border-border-gold rounded-md p-4 sm:p-6">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">基本情報を編集</h3>
        <div className="space-y-3">
          <Field label="法人名/屋号"><input value={f.companyName} onChange={(e) => setF({ ...f, companyName: e.target.value })} className={ic} /></Field>
          <Field label="代表者名"><input value={f.representativeName} onChange={(e) => setF({ ...f, representativeName: e.target.value })} className={ic} /></Field>
          <Field label="フリガナ"><input value={f.nameKana} onChange={(e) => setF({ ...f, nameKana: e.target.value })} className={ic} /></Field>
          <Field label="ログインID"><input value={f.loginId} readOnly className={ic + " opacity-60 cursor-not-allowed"} /></Field>
          <Field label="メール"><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={ic} /></Field>
          <Field label="電話番号"><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={ic} /></Field>
          <Field label="住所"><input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className={ic} /></Field>
        </div>
      </div>

      <div className="bg-bg-secondary border border-border-gold rounded-md p-4 sm:p-6">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">契約情報を編集</h3>
        <div className="space-y-3">
          <Field label="エージェントコード"><input value={f.agencyCode} readOnly className={ic + " font-mono opacity-60 cursor-not-allowed"} /></Field>
          <Field label="合計報酬率(%)">
            <input
              type="number"
              step="0.1"
              value={f.commissionRate}
              onChange={(e) => setF({ ...f, commissionRate: e.target.value })}
              className={ic + " font-mono"}
            />
          </Field>
          <Field label="営業マン取り分(%)">
            <input
              type="number"
              step="0.1"
              value={f.staffCommissionRate}
              onChange={(e) => setF({ ...f, staffCommissionRate: e.target.value })}
              className={ic + " font-mono"}
            />
            <div className="text-[11px] text-text-muted mt-1">
              → 代理店取り分: <span className="text-gold font-mono">{agencyRate.toFixed(1)}%</span>
              {staffRate > totalRate && (
                <span className="text-status-danger ml-2">※ 営業マン取り分が合計率を超えています</span>
              )}
            </div>
          </Field>
          <Field label="銀行名"><input value={f.bankName} onChange={(e) => setF({ ...f, bankName: e.target.value })} className={ic} /></Field>
          <Field label="支店名"><input value={f.bankBranch} onChange={(e) => setF({ ...f, bankBranch: e.target.value })} className={ic} /></Field>
          <Field label="口座種別">
            <select value={f.bankAccountType} onChange={(e) => setF({ ...f, bankAccountType: e.target.value })} className={ic + " cursor-pointer"}>
              <option value="">選択</option>
              <option value="普通">普通</option>
              <option value="当座">当座</option>
            </select>
          </Field>
          <Field label="口座番号"><input value={f.bankAccountNumber} onChange={(e) => setF({ ...f, bankAccountNumber: e.target.value })} className={ic + " font-mono"} /></Field>
          <Field label="口座名義"><input value={f.bankAccountName} onChange={(e) => setF({ ...f, bankAccountName: e.target.value })} className={ic} /></Field>
        </div>
      </div>

      <div className="sm:col-span-2 flex gap-2">
        <button
          onClick={save}
          disabled={saving || staffRate > totalRate}
          className="flex-1 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold cursor-pointer disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
        <button
          onClick={cancel}
          disabled={saving}
          className="px-6 py-2.5 border border-border text-text-secondary rounded-sm text-[13px] cursor-pointer disabled:opacity-50"
        >
          取消
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center py-2 border-b border-border last:border-b-0">
      <div className="w-28 text-[11px] text-text-muted shrink-0">{label}</div>
      <div className={`text-[13px] text-text-primary ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] text-text-muted mb-1">{label}</label>
      {children}
    </div>
  );
}
