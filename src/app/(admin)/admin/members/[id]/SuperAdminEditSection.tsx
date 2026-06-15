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
    scheme: "SCPP" | "MRT";
    role: string;
    isActive: boolean;
    mustChangePassword: boolean;
    hasAgreedPamphlet: boolean;
    currentIllness: boolean;
    currentIllnessDetail: string | null;
    pastIllness: boolean;
    pastIllnessDetail: string | null;
    currentMedication: boolean;
    currentMedicationDetail: string | null;
    chronicDisease: boolean;
    chronicDiseaseDetail: string | null;
    infectiousDisease: boolean;
    infectiousDiseaseDetail: string | null;
    pregnancy: boolean;
    allergy: boolean;
    allergyDetail: string | null;
    otherHealth: boolean;
    otherHealthDetail: string | null;
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
    clinicAddress: string | null;
    clinicPhone: string | null;
    serviceAppliedAt: string | null;
    consentSignedAt: string | null;
    contractSignedAt: string | null;
    ipsCompletedAt: string | null;
    storageStartAt: string | null;
    contractFormat: string | null;
    deathWish: string | null;
    referrerName: string | null;
  } | null;
}

const ROLE_OPTIONS = [
  { value: "MEMBER", label: "会員（MEMBER）" },
  { value: "ADMIN", label: "管理者（ADMIN）" },
  { value: "SUPER_ADMIN", label: "全権限者（SUPER_ADMIN）" },
  { value: "AGENCY", label: "代理店（AGENCY）" },
  { value: "STAFF", label: "従業員（STAFF）" },
  { value: "OPERATOR", label: "処理者（OPERATOR）" },
  { value: "VIEWER", label: "閲覧者（VIEWER）" },
];

export default function SuperAdminEditSection({ userId, user, membership }: Props) {
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);
  const [tab, setTab] = useState<"user" | "contract" | "account" | "health">("user");
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
    scheme: user.scheme,
  });

  // アカウント・権限フォーム
  const [accountForm, setAccountForm] = useState({
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    hasAgreedPamphlet: user.hasAgreedPamphlet,
    newPassword: "",
  });

  // 健康状態フォーム
  const [healthForm, setHealthForm] = useState({
    currentIllness: user.currentIllness,
    currentIllnessDetail: user.currentIllnessDetail || "",
    pastIllness: user.pastIllness,
    pastIllnessDetail: user.pastIllnessDetail || "",
    currentMedication: user.currentMedication,
    currentMedicationDetail: user.currentMedicationDetail || "",
    chronicDisease: user.chronicDisease,
    chronicDiseaseDetail: user.chronicDiseaseDetail || "",
    infectiousDisease: user.infectiousDisease,
    infectiousDiseaseDetail: user.infectiousDiseaseDetail || "",
    pregnancy: user.pregnancy,
    allergy: user.allergy,
    allergyDetail: user.allergyDetail || "",
    otherHealth: user.otherHealth,
    otherHealthDetail: user.otherHealthDetail || "",
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
    serviceAppliedAt: membership?.serviceAppliedAt?.split("T")[0] || "",
    consentSignedAt: membership?.consentSignedAt?.split("T")[0] || "",
    contractSignedAt: membership?.contractSignedAt?.split("T")[0] || "",
    clinicDate: membership?.clinicDate?.split("T")[0] || "",
    ipsCompletedAt: membership?.ipsCompletedAt?.split("T")[0] || "",
    storageStartAt: membership?.storageStartAt?.split("T")[0] || "",
    clinicName: membership?.clinicName || "",
    clinicAddress: membership?.clinicAddress || "",
    clinicPhone: membership?.clinicPhone || "",
    contractFormat: membership?.contractFormat || "",
    deathWish: membership?.deathWish || "",
    referrerName: membership?.referrerName || "",
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
        payload.scheme = userForm.scheme;
      } else if (tab === "account") {
        payload.role = accountForm.role;
        payload.isActive = accountForm.isActive;
        payload.mustChangePassword = accountForm.mustChangePassword;
        payload.hasAgreedPamphlet = accountForm.hasAgreedPamphlet;
        if (accountForm.newPassword) payload.newPassword = accountForm.newPassword;
      } else if (tab === "health") {
        payload.currentIllness = healthForm.currentIllness;
        payload.currentIllnessDetail = healthForm.currentIllnessDetail;
        payload.pastIllness = healthForm.pastIllness;
        payload.pastIllnessDetail = healthForm.pastIllnessDetail;
        payload.currentMedication = healthForm.currentMedication;
        payload.currentMedicationDetail = healthForm.currentMedicationDetail;
        payload.chronicDisease = healthForm.chronicDisease;
        payload.chronicDiseaseDetail = healthForm.chronicDiseaseDetail;
        payload.infectiousDisease = healthForm.infectiousDisease;
        payload.infectiousDiseaseDetail = healthForm.infectiousDiseaseDetail;
        payload.pregnancy = healthForm.pregnancy;
        payload.allergy = healthForm.allergy;
        payload.allergyDetail = healthForm.allergyDetail;
        payload.otherHealth = healthForm.otherHealth;
        payload.otherHealthDetail = healthForm.otherHealthDetail;
      } else {
        payload.membership = {
          memberNumber: contractForm.memberNumber,
          totalAmount: Number(contractForm.totalAmount),
          paidAmount: Number(contractForm.paidAmount),
          paymentStatus: contractForm.paymentStatus,
          ipsStatus: contractForm.ipsStatus,
          contractDate: contractForm.contractDate || null,
          storageYears: Number(contractForm.storageYears),
          serviceAppliedAt: contractForm.serviceAppliedAt || null,
          consentSignedAt: contractForm.consentSignedAt || null,
          contractSignedAt: contractForm.contractSignedAt || null,
          clinicDate: contractForm.clinicDate || null,
          ipsCompletedAt: contractForm.ipsCompletedAt || null,
          storageStartAt: contractForm.storageStartAt || null,
          clinicName: contractForm.clinicName || null,
          clinicAddress: contractForm.clinicAddress || null,
          clinicPhone: contractForm.clinicPhone || null,
          contractFormat: contractForm.contractFormat || null,
          deathWish: contractForm.deathWish || null,
          referrerName: contractForm.referrerName || null,
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
            <div className="flex flex-wrap border-b border-border mb-4">
              <button onClick={() => setTab("user")} className={`px-3 py-2 text-sm cursor-pointer ${tab === "user" ? "text-gold border-b-2 border-gold" : "text-text-muted"}`}>基本情報</button>
              <button onClick={() => setTab("contract")} className={`px-3 py-2 text-sm cursor-pointer ${tab === "contract" ? "text-gold border-b-2 border-gold" : "text-text-muted"}`}>契約情報</button>
              <button onClick={() => setTab("account")} className={`px-3 py-2 text-sm cursor-pointer ${tab === "account" ? "text-gold border-b-2 border-gold" : "text-text-muted"}`}>アカウント・権限</button>
              <button onClick={() => setTab("health")} className={`px-3 py-2 text-sm cursor-pointer ${tab === "health" ? "text-gold border-b-2 border-gold" : "text-text-muted"}`}>健康状態</button>
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
                <div>
                  <label className="block text-[10px] text-text-muted mb-1">流入スキーム（契約主体）</label>
                  <select value={userForm.scheme} onChange={(e) => setUserForm(f => ({ ...f, scheme: e.target.value as "SCPP" | "MRT" }))} className={ic + " cursor-pointer"}>
                    <option value="SCPP">SCPP（株式会社SCPP）</option>
                    <option value="MRT">MRT（株式会社MRT）</option>
                  </select>
                  <p className="text-[9px] text-text-muted mt-1">会員一覧の流入バッジ・絞り込み、同意書/特商法表記の会社名に反映されます。</p>
                </div>
                <div className="flex items-center gap-2 py-1">
                  <input type="checkbox" id="agreedTerms" checked={userForm.hasAgreedTerms} onChange={(e) => setUserForm(f => ({ ...f, hasAgreedTerms: e.target.checked }))} className="cursor-pointer" />
                  <label htmlFor="agreedTerms" className="text-xs text-text-secondary cursor-pointer">重要事項説明に同意済み</label>
                </div>
              </div>
            ) : tab === "account" ? (
              <div className="space-y-3">
                <div className="p-2 bg-red-500/5 border border-red-500/20 rounded text-[10px] text-red-300">
                  権限ロールの変更・パスワード再設定は影響が大きい操作です。慎重に変更してください。
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-1">権限ロール</label>
                  <select value={accountForm.role} onChange={(e) => setAccountForm(f => ({ ...f, role: e.target.value }))} className={ic + " cursor-pointer"}>
                    {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted mb-1">パスワード再設定（入力時のみ変更）</label>
                  <input type="text" value={accountForm.newPassword} onChange={(e) => setAccountForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="新しいパスワード" className={ic + " font-mono"} />
                  <p className="text-[9px] text-text-muted mt-1">空欄のままなら変更されません。設定すると会員に新パスワードでログインしてもらえます。</p>
                </div>
                <div className="flex items-center gap-2 py-1">
                  <input type="checkbox" id="isActive" checked={accountForm.isActive} onChange={(e) => setAccountForm(f => ({ ...f, isActive: e.target.checked }))} className="cursor-pointer" />
                  <label htmlFor="isActive" className="text-xs text-text-secondary cursor-pointer">アカウント有効（オフにすると無効化・ログイン不可）</label>
                </div>
                <div className="flex items-center gap-2 py-1">
                  <input type="checkbox" id="mustChangePassword" checked={accountForm.mustChangePassword} onChange={(e) => setAccountForm(f => ({ ...f, mustChangePassword: e.target.checked }))} className="cursor-pointer" />
                  <label htmlFor="mustChangePassword" className="text-xs text-text-secondary cursor-pointer">次回ログイン時にパスワード変更を要求</label>
                </div>
                <div className="flex items-center gap-2 py-1">
                  <input type="checkbox" id="hasAgreedPamphlet" checked={accountForm.hasAgreedPamphlet} onChange={(e) => setAccountForm(f => ({ ...f, hasAgreedPamphlet: e.target.checked }))} className="cursor-pointer" />
                  <label htmlFor="hasAgreedPamphlet" className="text-xs text-text-secondary cursor-pointer">パンフレット免責事項に同意済み</label>
                </div>
              </div>
            ) : tab === "health" ? (
              <div className="space-y-2">
                <HealthEdit label="現在治療中の病気" has={healthForm.currentIllness} detail={healthForm.currentIllnessDetail} onHas={(v) => setHealthForm(f => ({ ...f, currentIllness: v }))} onDetail={(v) => setHealthForm(f => ({ ...f, currentIllnessDetail: v }))} ic={ic} />
                <HealthEdit label="過去の大きな病気・手術歴" has={healthForm.pastIllness} detail={healthForm.pastIllnessDetail} onHas={(v) => setHealthForm(f => ({ ...f, pastIllness: v }))} onDetail={(v) => setHealthForm(f => ({ ...f, pastIllnessDetail: v }))} ic={ic} />
                <HealthEdit label="現在使用中の薬" has={healthForm.currentMedication} detail={healthForm.currentMedicationDetail} onHas={(v) => setHealthForm(f => ({ ...f, currentMedication: v }))} onDetail={(v) => setHealthForm(f => ({ ...f, currentMedicationDetail: v }))} ic={ic} />
                <HealthEdit label="持病" has={healthForm.chronicDisease} detail={healthForm.chronicDiseaseDetail} onHas={(v) => setHealthForm(f => ({ ...f, chronicDisease: v }))} onDetail={(v) => setHealthForm(f => ({ ...f, chronicDiseaseDetail: v }))} ic={ic} />
                <HealthEdit label="感染症の罹患・既往" has={healthForm.infectiousDisease} detail={healthForm.infectiousDiseaseDetail} onHas={(v) => setHealthForm(f => ({ ...f, infectiousDisease: v }))} onDetail={(v) => setHealthForm(f => ({ ...f, infectiousDiseaseDetail: v }))} ic={ic} />
                <HealthEdit label="アレルギー" has={healthForm.allergy} detail={healthForm.allergyDetail} onHas={(v) => setHealthForm(f => ({ ...f, allergy: v }))} onDetail={(v) => setHealthForm(f => ({ ...f, allergyDetail: v }))} ic={ic} />
                <HealthEdit label="その他健康上の事項" has={healthForm.otherHealth} detail={healthForm.otherHealthDetail} onHas={(v) => setHealthForm(f => ({ ...f, otherHealth: v }))} onDetail={(v) => setHealthForm(f => ({ ...f, otherHealthDetail: v }))} ic={ic} />
                <div className="flex items-center gap-2 py-1 pt-2 border-t border-border">
                  <input type="checkbox" id="pregnancy" checked={healthForm.pregnancy} onChange={(e) => setHealthForm(f => ({ ...f, pregnancy: e.target.checked }))} className="cursor-pointer" />
                  <label htmlFor="pregnancy" className="text-xs text-text-secondary cursor-pointer">妊娠中または妊娠の可能性あり</label>
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

                {/* 会員の歩み（各種日付）— 空欄で未設定（クリア） */}
                <div className="pt-3 mt-1 border-t border-border">
                  <p className="text-[10px] text-gold mb-2 tracking-wider">会員の歩み（日付）</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1">iPSサービス申込日</label>
                      <input type="date" value={contractForm.serviceAppliedAt} onChange={(e) => setContractForm(f => ({ ...f, serviceAppliedAt: e.target.value }))} className={ic} />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1">同意書署名日</label>
                      <input type="date" value={contractForm.consentSignedAt} onChange={(e) => setContractForm(f => ({ ...f, consentSignedAt: e.target.value }))} className={ic} />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1">契約署名日</label>
                      <input type="date" value={contractForm.contractSignedAt} onChange={(e) => setContractForm(f => ({ ...f, contractSignedAt: e.target.value }))} className={ic} />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1">採血日（クリニック）</label>
                      <input type="date" value={contractForm.clinicDate} onChange={(e) => setContractForm(f => ({ ...f, clinicDate: e.target.value }))} className={ic} />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1">iPS細胞 完成日</label>
                      <input type="date" value={contractForm.ipsCompletedAt} onChange={(e) => setContractForm(f => ({ ...f, ipsCompletedAt: e.target.value }))} className={ic} />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1">保管開始日</label>
                      <input type="date" value={contractForm.storageStartAt} onChange={(e) => setContractForm(f => ({ ...f, storageStartAt: e.target.value }))} className={ic} />
                    </div>
                  </div>
                </div>

                {/* クリニック情報 */}
                <div className="pt-3 mt-1 border-t border-border">
                  <p className="text-[10px] text-gold mb-2 tracking-wider">クリニック情報</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1">クリニック名</label>
                      <input value={contractForm.clinicName} onChange={(e) => setContractForm(f => ({ ...f, clinicName: e.target.value }))} className={ic} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-text-muted mb-1">クリニック住所</label>
                        <input value={contractForm.clinicAddress} onChange={(e) => setContractForm(f => ({ ...f, clinicAddress: e.target.value }))} className={ic} />
                      </div>
                      <div>
                        <label className="block text-[10px] text-text-muted mb-1">クリニック電話</label>
                        <input value={contractForm.clinicPhone} onChange={(e) => setContractForm(f => ({ ...f, clinicPhone: e.target.value }))} className={ic + " font-mono"} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 契約その他 */}
                <div className="pt-3 mt-1 border-t border-border">
                  <p className="text-[10px] text-gold mb-2 tracking-wider">契約その他</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1">契約書形式</label>
                      <select value={contractForm.contractFormat} onChange={(e) => setContractForm(f => ({ ...f, contractFormat: e.target.value }))} className={ic + " cursor-pointer"}>
                        <option value="">未設定</option>
                        <option value="electronic">電子署名</option>
                        <option value="paper">書面契約</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-muted mb-1">死亡時意思表示</label>
                      <select value={contractForm.deathWish} onChange={(e) => setContractForm(f => ({ ...f, deathWish: e.target.value }))} className={ic + " cursor-pointer"}>
                        <option value="">未設定</option>
                        <option value="donate">寄贈</option>
                        <option value="dispose">廃棄</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-[10px] text-text-muted mb-1">紹介者名</label>
                    <input value={contractForm.referrerName} onChange={(e) => setContractForm(f => ({ ...f, referrerName: e.target.value }))} className={ic} />
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

// 健康状態の1項目（なし/あり + 詳細入力）
function HealthEdit({
  label,
  has,
  detail,
  onHas,
  onDetail,
  ic,
}: {
  label: string;
  has: boolean;
  detail: string;
  onHas: (v: boolean) => void;
  onDetail: (v: string) => void;
  ic: string;
}) {
  return (
    <div className="py-1.5 border-b border-border last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-text-secondary">{label}</span>
        <div className="flex gap-3 shrink-0">
          <label className="flex items-center gap-1 text-xs text-text-secondary cursor-pointer">
            <input type="radio" checked={!has} onChange={() => onHas(false)} className="cursor-pointer" /> なし
          </label>
          <label className="flex items-center gap-1 text-xs text-text-secondary cursor-pointer">
            <input type="radio" checked={has} onChange={() => onHas(true)} className="cursor-pointer" /> あり
          </label>
        </div>
      </div>
      {has && (
        <input value={detail} onChange={(e) => onDetail(e.target.value)} placeholder="詳細・内容" className={ic + " mt-2"} />
      )}
    </div>
  );
}
