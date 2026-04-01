"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import GoldDivider from "@/components/ui/GoldDivider";

// 職業選択肢
const OCCUPATION_OPTIONS = [
  "経営者・役員",
  "会社員",
  "医療専門職",
  "自営業",
  "公務員",
  "士業",
  "主婦・主夫",
  "年金受給者",
  "その他",
];

export default function ApplyServicePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ステップ管理（1: 健康状態・支払, 2: 同意書, 3: 確認）
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // 健康状態
  const [healthData, setHealthData] = useState({
    currentIllness: false, currentIllnessDetail: "",
    pastIllness: false, pastIllnessDetail: "",
    currentMedication: false, currentMedicationDetail: "",
    chronicDisease: false, chronicDiseaseDetail: "",
    infectiousDisease: false, infectiousDiseaseDetail: "",
    pregnancy: false,
    allergy: false, allergyDetail: "",
    otherHealth: false, otherHealthDetail: "",
  });

  // 支払情報
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentYear, setPaymentYear] = useState("");
  const [paymentMonth, setPaymentMonth] = useState("");

  // 同意書スクロール
  const consentRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  // 確認チェック
  const [confirmChecks, setConfirmChecks] = useState({
    confirmNotMedical: false,
    confirmScppRole: false,
    confirmClinicRole: false,
    confirmLabRole: false,
    confirmDocuments: false,
  });

  // セッションチェック
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // 同意書スクロール検知
  const handleConsentScroll = () => {
    if (!consentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = consentRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setScrolledToBottom(true);
    }
  };

  // 健康状態チェック変更
  const updateHealth = (key: string, value: boolean | string) => {
    setHealthData((prev) => ({ ...prev, [key]: value }));
  };

  // 確認チェック変更
  const updateConfirm = (key: string, value: boolean) => {
    setConfirmChecks((prev) => ({ ...prev, [key]: value }));
  };

  // 全確認項目がチェックされているか
  const allConfirmed = Object.values(confirmChecks).every(Boolean);

  // 申込送信
  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const paymentDate = paymentYear && paymentMonth
        ? new Date(`${paymentYear}-${paymentMonth}-01`)
        : null;

      const res = await fetch("/api/member/apply-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...healthData,
          paymentMethod,
          paymentDate: paymentDate?.toISOString() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "申込に失敗しました");
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-text-muted text-sm">読み込み中...</div>
      </div>
    );
  }

  // 申込完了画面
  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-bg-secondary border border-border-gold rounded-md p-8 sm:p-12 text-center">
          <div className="text-4xl mb-4">✨</div>
          <h2 className="font-serif-jp text-xl text-gold tracking-wider mb-4">
            お申込みありがとうございます
          </h2>
          <GoldDivider />
          <p className="text-text-secondary text-sm leading-relaxed mt-6 mb-2">
            iPSサービスへのお申込みを受け付けました。
          </p>
          <p className="text-text-secondary text-sm leading-relaxed mb-8">
            担当者より改めてご連絡させていただきます。
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-8 py-3 bg-gold-gradient text-bg-primary text-sm font-medium rounded tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
          >
            マイページに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="text-[10px] tracking-[4px] text-gold mb-2">SERVICE APPLICATION</div>
        <h2 className="font-serif-jp text-xl sm:text-2xl font-normal text-text-primary tracking-wider">
          iPSサービス申込
        </h2>
        <GoldDivider />
      </div>

      {/* ステップインジケーター */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono ${
                s === step
                  ? "bg-gold text-bg-primary"
                  : s < step
                  ? "bg-gold/20 text-gold"
                  : "bg-bg-elevated text-text-muted"
              }`}
            >
              {s < step ? "✓" : s}
            </div>
            {s < 3 && (
              <div
                className={`w-12 h-[1px] ${
                  s < step ? "bg-gold" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ステップ1: 健康状態・支払い情報 */}
      {step === 1 && (
        <div className="space-y-6">
          {/* サービス価格表示 */}
          <div className="bg-bg-secondary border border-border-gold rounded-md p-6 text-center">
            <div className="text-xs text-text-muted tracking-wider mb-2">会員価格（税込）</div>
            <div className="font-mono text-3xl text-gold font-light tracking-wider">
              ¥8,800,000
            </div>
          </div>

          {/* 支払方法 */}
          <div className="bg-bg-secondary border border-border rounded-md p-6">
            <h3 className="text-sm text-text-primary tracking-wider mb-4">お支払い方法</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank_transfer"
                  checked={paymentMethod === "bank_transfer"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="accent-gold"
                />
                <span className="text-sm text-text-secondary">銀行振込</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="other"
                  checked={paymentMethod === "other"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="accent-gold"
                />
                <span className="text-sm text-text-secondary">その他</span>
              </label>
            </div>

            {/* 支払予定日 */}
            <div className="mt-4">
              <label className="text-xs text-text-muted mb-2 block">お支払い予定日</label>
              <div className="flex gap-2">
                <select
                  value={paymentYear}
                  onChange={(e) => setPaymentYear(e.target.value)}
                  className="bg-bg-tertiary border border-border rounded px-3 py-2 text-sm text-text-primary flex-1"
                >
                  <option value="">年</option>
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}年</option>
                  ))}
                </select>
                <select
                  value={paymentMonth}
                  onChange={(e) => setPaymentMonth(e.target.value)}
                  className="bg-bg-tertiary border border-border rounded px-3 py-2 text-sm text-text-primary flex-1"
                >
                  <option value="">月</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={String(m).padStart(2, "0")}>{m}月</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 健康状態自己申告 */}
          <div className="bg-bg-secondary border border-border rounded-md p-6">
            <h3 className="text-sm text-text-primary tracking-wider mb-4">事前確認事項（健康状態）</h3>
            <div className="space-y-4">
              <HealthCheckItem
                label="現在治療中の病気はありますか？"
                checked={healthData.currentIllness}
                onChange={(v) => updateHealth("currentIllness", v)}
                detail={healthData.currentIllnessDetail}
                onDetailChange={(v) => updateHealth("currentIllnessDetail", v)}
              />
              <HealthCheckItem
                label="過去に大きな病気・手術歴はありますか？"
                checked={healthData.pastIllness}
                onChange={(v) => updateHealth("pastIllness", v)}
                detail={healthData.pastIllnessDetail}
                onDetailChange={(v) => updateHealth("pastIllnessDetail", v)}
              />
              <HealthCheckItem
                label="現在使用中の薬はありますか？"
                checked={healthData.currentMedication}
                onChange={(v) => updateHealth("currentMedication", v)}
                detail={healthData.currentMedicationDetail}
                onDetailChange={(v) => updateHealth("currentMedicationDetail", v)}
              />
              <HealthCheckItem
                label="持病はありますか？"
                checked={healthData.chronicDisease}
                onChange={(v) => updateHealth("chronicDisease", v)}
                detail={healthData.chronicDiseaseDetail}
                onDetailChange={(v) => updateHealth("chronicDiseaseDetail", v)}
              />
              <HealthCheckItem
                label="感染症に罹患したことはありますか？"
                checked={healthData.infectiousDisease}
                onChange={(v) => updateHealth("infectiousDisease", v)}
                detail={healthData.infectiousDiseaseDetail}
                onDetailChange={(v) => updateHealth("infectiousDiseaseDetail", v)}
              />
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={healthData.pregnancy}
                  onChange={(e) => updateHealth("pregnancy", e.target.checked)}
                  className="accent-gold w-4 h-4"
                />
                <span className="text-sm text-text-secondary">妊娠中、もしくは妊娠の可能性がある</span>
              </div>
              <HealthCheckItem
                label="アレルギーはありますか？"
                checked={healthData.allergy}
                onChange={(v) => updateHealth("allergy", v)}
                detail={healthData.allergyDetail}
                onDetailChange={(v) => updateHealth("allergyDetail", v)}
              />
              <HealthCheckItem
                label="その他、健康上の気になる事項はありますか？"
                checked={healthData.otherHealth}
                onChange={(v) => updateHealth("otherHealth", v)}
                detail={healthData.otherHealthDetail}
                onDetailChange={(v) => updateHealth("otherHealthDetail", v)}
              />
            </div>
          </div>

          {/* 確認事項 */}
          <div className="bg-bg-secondary border border-border rounded-md p-6">
            <h3 className="text-sm text-text-primary tracking-wider mb-4">確認事項</h3>
            <div className="space-y-3">
              <ConfirmItem
                label="BioVaultメンバーシップは医療行為の直接提供ではないことを理解しました"
                checked={confirmChecks.confirmNotMedical}
                onChange={(v) => updateConfirm("confirmNotMedical", v)}
              />
              <ConfirmItem
                label="株式会社SCPPがBioVaultの運営主体であることを確認しました"
                checked={confirmChecks.confirmScppRole}
                onChange={(v) => updateConfirm("confirmScppRole", v)}
              />
              <ConfirmItem
                label="提携医療機関の役割について理解しました"
                checked={confirmChecks.confirmClinicRole}
                onChange={(v) => updateConfirm("confirmClinicRole", v)}
              />
              <ConfirmItem
                label="提携先施設の役割について理解しました"
                checked={confirmChecks.confirmLabRole}
                onChange={(v) => updateConfirm("confirmLabRole", v)}
              />
              <ConfirmItem
                label="関連文書を確認しました"
                checked={confirmChecks.confirmDocuments}
                onChange={(v) => updateConfirm("confirmDocuments", v)}
              />
            </div>
          </div>

          <button
            onClick={() => { setStep(2); window.scrollTo(0, 0); }}
            disabled={!allConfirmed}
            className={`w-full py-4 rounded text-sm tracking-wider transition-all cursor-pointer ${
              allConfirmed
                ? "bg-gold-gradient text-bg-primary hover:opacity-90"
                : "bg-bg-elevated text-text-muted opacity-40 cursor-not-allowed"
            }`}
          >
            次へ：同意書の確認
          </button>
        </div>
      )}

      {/* ステップ2: 同意書 */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-bg-secondary border border-border rounded-md p-6">
            <h3 className="text-sm text-text-primary tracking-wider mb-4">同意書</h3>
            <div
              ref={consentRef}
              onScroll={handleConsentScroll}
              className="max-h-[60vh] overflow-y-auto border border-border rounded p-4 bg-bg-tertiary text-sm text-text-secondary leading-relaxed"
            >
              {/* 同意書の本文（プレースホルダー - 別途指示待ち） */}
              <h4 className="text-gold mb-4 font-medium">BioVaultメンバーシップ 同意書</h4>
              <p className="mb-4">
                本同意書は、BioVaultメンバーシップ（以下「本サービス」）のお申込みにあたり、
                以下の事項について確認・同意いただくものです。
              </p>
              <p className="mb-4">
                ※ 同意書の詳細内容は現在準備中です。確定次第、こちらに反映されます。
              </p>
              <div className="py-40 text-center text-text-muted text-xs">
                （同意書本文 — 別途指示により更新予定）
              </div>
              <p className="text-xs text-text-muted mt-4">
                以上の内容をよくお読みいただき、ご同意のうえ、下記チェックボックスにチェックを入れてください。
              </p>
            </div>

            {/* スクロール案内 */}
            {!scrolledToBottom && (
              <div className="mt-3 text-center text-xs text-gold animate-pulse">
                ↓ 最後までスクロールしてください
              </div>
            )}

            {/* 同意チェック */}
            <div className={`mt-4 transition-opacity ${scrolledToBottom ? "opacity-100" : "opacity-40"}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => scrolledToBottom && setConsentChecked(e.target.checked)}
                  disabled={!scrolledToBottom}
                  className="accent-gold w-4 h-4"
                />
                <span className="text-sm text-text-secondary">
                  上記の同意書の内容をすべて確認し、同意します
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStep(1); window.scrollTo(0, 0); }}
              className="flex-1 py-3 border border-border text-text-secondary rounded text-sm hover:border-border-gold hover:text-gold transition-all cursor-pointer"
            >
              戻る
            </button>
            <button
              onClick={() => { setStep(3); window.scrollTo(0, 0); }}
              disabled={!consentChecked}
              className={`flex-1 py-3 rounded text-sm tracking-wider transition-all cursor-pointer ${
                consentChecked
                  ? "bg-gold-gradient text-bg-primary hover:opacity-90"
                  : "bg-bg-elevated text-text-muted opacity-40 cursor-not-allowed"
              }`}
            >
              次へ：最終確認
            </button>
          </div>
        </div>
      )}

      {/* ステップ3: 最終確認 */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-bg-secondary border border-border rounded-md p-6">
            <h3 className="text-sm text-text-primary tracking-wider mb-4">お申込み内容の確認</h3>

            <div className="space-y-4">
              <div className="border-b border-border pb-3">
                <div className="text-xs text-text-muted mb-1">会員価格（税込）</div>
                <div className="font-mono text-lg text-gold">¥8,800,000</div>
              </div>

              <div className="border-b border-border pb-3">
                <div className="text-xs text-text-muted mb-1">お支払い方法</div>
                <div className="text-sm text-text-primary">
                  {paymentMethod === "bank_transfer" ? "銀行振込" : "その他"}
                </div>
              </div>

              {paymentYear && paymentMonth && (
                <div className="border-b border-border pb-3">
                  <div className="text-xs text-text-muted mb-1">お支払い予定日</div>
                  <div className="text-sm text-text-primary">{paymentYear}年{parseInt(paymentMonth)}月</div>
                </div>
              )}

              <div className="border-b border-border pb-3">
                <div className="text-xs text-text-muted mb-1">健康状態</div>
                <div className="text-sm text-text-primary">入力済み ✓</div>
              </div>

              <div className="border-b border-border pb-3">
                <div className="text-xs text-text-muted mb-1">確認事項</div>
                <div className="text-sm text-text-primary">全項目確認済み ✓</div>
              </div>

              <div>
                <div className="text-xs text-text-muted mb-1">同意書</div>
                <div className="text-sm text-text-primary">同意済み ✓</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-status-danger/10 border border-status-danger/30 rounded-md p-4 text-sm text-status-danger">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setStep(2); window.scrollTo(0, 0); }}
              className="flex-1 py-3 border border-border text-text-secondary rounded text-sm hover:border-border-gold hover:text-gold transition-all cursor-pointer"
            >
              戻る
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-4 bg-gold-gradient text-bg-primary rounded text-sm tracking-wider hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40"
            >
              {loading ? "送信中..." : "申し込む"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 健康状態チェック項目コンポーネント
function HealthCheckItem({
  label,
  checked,
  onChange,
  detail,
  onDetailChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  detail: string;
  onDetailChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-gold w-4 h-4"
        />
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      {checked && (
        <input
          type="text"
          value={detail}
          onChange={(e) => onDetailChange(e.target.value)}
          placeholder="詳細を入力してください"
          className="mt-2 ml-7 w-[calc(100%-28px)] bg-bg-tertiary border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
        />
      )}
    </div>
  );
}

// 確認チェック項目コンポーネント
function ConfirmItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-gold w-4 h-4 mt-0.5 shrink-0"
      />
      <span className="text-sm text-text-secondary leading-relaxed">{label}</span>
    </label>
  );
}
