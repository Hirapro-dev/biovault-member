"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

const IPS_STATUS_OPTIONS = [
  { value: "REGISTERED", label: "メンバー登録済み" },
  { value: "TERMS_AGREED", label: "重要事項確認済み" },
  { value: "SERVICE_APPLIED", label: "iPSサービス申込済み" },
  { value: "SCHEDULE_ARRANGED", label: "日程調整中" },
  { value: "BLOOD_COLLECTED", label: "問診・採血完了" },
  { value: "IPS_CREATING", label: "iPS作製中" },
  { value: "STORAGE_ACTIVE", label: "iPS保管中" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "PENDING", label: "未入金" },
  { value: "PARTIAL", label: "一部入金" },
  { value: "COMPLETED", label: "入金完了" },
];

interface Props {
  userId: string;
  user: {
    name: string;
    nameKana: string | null;
    nameRomaji: string | null;
    email: string;
    loginId: string;
    phone: string | null;
    address: string | null;
    postalCode: string | null;
    occupation: string | null;
    dateOfBirth: string | null;
    hasAgreedTerms: boolean;
    referredByStaff: string | null;
    referredByAgency: string | null;
    salesRepName: string | null;
    paymentMethod: string | null;
  };
  membership: {
    memberNumber: string;
    totalAmount: number;
    paidAmount: number;
    paymentStatus: string;
    ipsStatus: string;
    contractDate: string;
    storageYears: number;
    clinicDate: string | null;
    clinicName: string | null;
  } | null;
}

export default function SuperAdminEditSection({ userId, user, membership }: Props) {
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);
  const [tab, setTab] = useState<"user" | "contract">("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ユーザー情報フォーム
  const [userForm, setUserForm] = useState({
    name: user.name,
    nameKana: user.nameKana || "",
    nameRomaji: user.nameRomaji || "",
    email: user.email,
    loginId: user.loginId,
    phone: user.phone || "",
    address: user.address || "",
    postalCode: user.postalCode || "",
    occupation: user.occupation || "",
    dateOfBirth: user.dateOfBirth?.split("T")[0] || "",
    hasAgreedTerms: user.hasAgreedTerms,
    referredByStaff: user.referredByStaff || "",
    referredByAgency: user.referredByAgency || "",
    salesRepName: user.salesRepName || "",
    paymentMethod: user.paymentMethod || "bank_transfer",
  });

  // 契約情報フォーム
  const [contractForm, setContractForm] = useState({
    memberNumber: membership?.memberNumber || "",
    totalAmount: membership?.totalAmount || 8800000,
    paidAmount: membership?.paidAmount || 0,
    paymentStatus: membership?.paymentStatus || "PENDING",
    ipsStatus: membership?.ipsStatus || "REGISTERED",
    contractDate: membership?.contractDate?.split("T")[0] || "",
    storageYears: membership?.storageYears || 10,
  });

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload: Record<string, unknown> = {};

      if (tab === "user") {
        payload.name = userForm.name;
        payload.nameKana = userForm.nameKana;
        payload.nameRomaji = userForm.nameRomaji;
        payload.email = userForm.email;
        payload.loginId = userForm.loginId;
        payload.phone = userForm.phone;
        payload.address = userForm.address;
        payload.postalCode = userForm.postalCode;
        payload.occupation = userForm.occupation;
        payload.dateOfBirth = userForm.dateOfBirth || null;
        payload.hasAgreedTerms = userForm.hasAgreedTerms;
        payload.referredByStaff = userForm.referredByStaff || null;
        payload.referredByAgency = userForm.referredByAgency || null;
        payload.salesRepName = userForm.salesRepName || null;
        payload.paymentMethod = userForm.paymentMethod || null;
      } else {
        payload.membership = {
          memberNumber: contractForm.memberNumber,
          totalAmount: Number(contractForm.totalAmount),
          paidAmount: Number(contractForm.paidAmount),
          paymentStatus: contractForm.paymentStatus,
          ipsStatus: contractForm.ipsStatus,
          contractDate: contractForm.contractDate || null,
          storageYears: Number(contractForm.storageYears),
        };
      }

      const res = await fetch(`/api/admin/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        }, 1200);
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const ic = "w-full px-3 py-2 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none focus:border-border-gold";

  return (
    <>
      <div className="mt-5">
        <button
          onClick={() => { setError(""); setSuccess(""); setShowPopup(true); }}
          className="px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-sm text-xs hover:bg-red-500/20 transition-all cursor-pointer"
        >
          全権限者編集（基本情報・契約情報・ステータス）
        </button>
      </div>

      {showPopup && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowPopup(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-bg-secondary border border-red-500/30 rounded-xl p-5 sm:p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">全権限者専用</span>
            </div>
            <h3 className="font-serif-jp text-base text-gold tracking-wider mb-1">会員情報の直接編集</h3>
            <p className="text-[10px] text-text-muted mb-4">全てのフィールドを直接編集できます。変更は即座に反映されます。</p>

            {success && <div className="mb-3 p-2 bg-status-active/10 border border-status-active/20 rounded text-status-active text-[11px]">{success}</div>}
            {error && <div className="mb-3 p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-[11px]">{error}</div>}

            {/* タブ */}
            <div className="flex border-b border-border mb-4">
              <button onClick={() => setTab("user")} className={`px-4 py-2 text-sm cursor-pointer ${tab === "user" ? "text-gold border-b-2 border-gold" : "text-text-muted"}`}>基本情報</button>
              <button onClick={() => setTab("contract")} className={`px-4 py-2 text-sm cursor-pointer ${tab === "contract" ? "text-gold border-b-2 border-gold" : "text-text-muted"}`}>契約情報</button>
            </div>

            {tab === "user" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1">氏名</label>
                    <input value={userForm.name} onChange={(e) => setUserForm(f => ({ ...f, name: e.target.value }))} className={ic} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1">フリガナ</label>
                    <input value={userForm.nameKana} onChange={(e) => setUserForm(f => ({ ...f, nameKana: e.target.value }))} className={ic} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-1">ローマ字</label>
                  <input value={userForm.nameRomaji} onChange={(e) => setUserForm(f => ({ ...f, nameRomaji: e.target.value }))} className={ic} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1">メールアドレス</label>
                    <input type="email" value={userForm.email} onChange={(e) => setUserForm(f => ({ ...f, email: e.target.value }))} className={ic} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1">ログインID</label>
                    <input value={userForm.loginId} onChange={(e) => setUserForm(f => ({ ...f, loginId: e.target.value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() }))} className={ic + " font-mono"} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1">電話番号</label>
                    <input value={userForm.phone} onChange={(e) => setUserForm(f => ({ ...f, phone: e.target.value }))} className={ic} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1">生年月日</label>
                    <input type="date" value={userForm.dateOfBirth} onChange={(e) => setUserForm(f => ({ ...f, dateOfBirth: e.target.value }))} className={ic} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-1">郵便番号</label>
                  <input value={userForm.postalCode} onChange={(e) => setUserForm(f => ({ ...f, postalCode: e.target.value }))} className={ic} />
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-1">住所</label>
                  <input value={userForm.address} onChange={(e) => setUserForm(f => ({ ...f, address: e.target.value }))} className={ic} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1">職業</label>
                    <input value={userForm.occupation} onChange={(e) => setUserForm(f => ({ ...f, occupation: e.target.value }))} className={ic} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1">支払方法</label>
                    <select value={userForm.paymentMethod} onChange={(e) => setUserForm(f => ({ ...f, paymentMethod: e.target.value }))} className={ic + " cursor-pointer"}>
                      <option value="bank_transfer">銀行振込</option>
                      <option value="credit_card">クレジットカード</option>
                      <option value="other">その他</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1">担当従業員コード</label>
                    <input value={userForm.referredByStaff} onChange={(e) => setUserForm(f => ({ ...f, referredByStaff: e.target.value }))} placeholder="ST-0001" className={ic + " font-mono"} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1">担当代理店コード</label>
                    <input value={userForm.referredByAgency} onChange={(e) => setUserForm(f => ({ ...f, referredByAgency: e.target.value }))} placeholder="AG-0001" className={ic + " font-mono"} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-1">担当営業者名</label>
                  <input value={userForm.salesRepName} onChange={(e) => setUserForm(f => ({ ...f, salesRepName: e.target.value }))} className={ic} />
                </div>
                <div className="flex items-center gap-2 py-1">
                  <input type="checkbox" id="agreedTerms" checked={userForm.hasAgreedTerms} onChange={(e) => setUserForm(f => ({ ...f, hasAgreedTerms: e.target.checked }))} className="cursor-pointer" />
                  <label htmlFor="agreedTerms" className="text-xs text-text-secondary cursor-pointer">重要事項説明に同意済み</label>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1">会員番号</label>
                    <input value={contractForm.memberNumber} onChange={(e) => setContractForm(f => ({ ...f, memberNumber: e.target.value }))} className={ic + " font-mono"} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1">契約日</label>
                    <input type="date" value={contractForm.contractDate} onChange={(e) => setContractForm(f => ({ ...f, contractDate: e.target.value }))} className={ic} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-1">iPSステータス</label>
                  <select value={contractForm.ipsStatus} onChange={(e) => setContractForm(f => ({ ...f, ipsStatus: e.target.value }))} className={ic + " cursor-pointer"}>
                    {IPS_STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1">契約金額（税込）</label>
                    <input type="number" value={contractForm.totalAmount} onChange={(e) => setContractForm(f => ({ ...f, totalAmount: Number(e.target.value) }))} className={ic + " font-mono"} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1">入金額</label>
                    <input type="number" value={contractForm.paidAmount} onChange={(e) => setContractForm(f => ({ ...f, paidAmount: Number(e.target.value) }))} className={ic + " font-mono"} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1">入金状況</label>
                    <select value={contractForm.paymentStatus} onChange={(e) => setContractForm(f => ({ ...f, paymentStatus: e.target.value }))} className={ic + " cursor-pointer"}>
                      {PAYMENT_STATUS_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1">保管年数</label>
                    <input type="number" value={contractForm.storageYears} onChange={(e) => setContractForm(f => ({ ...f, storageYears: Number(e.target.value) }))} min={1} className={ic + " font-mono"} />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 mt-4 border-t border-border">
              <button onClick={() => setShowPopup(false)} className="px-4 py-2.5 border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold transition-all">キャンセル</button>
              <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50">
                {loading ? "更新中..." : "更新する"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
