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

  // ステップ管理（1: 情報・確認, 2: 利用規約, 3: iPSサービス契約書, 4: 最終確認）
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
  const [healthLoaded, setHealthLoaded] = useState(false);

  // 支払情報
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentYear, setPaymentYear] = useState("");
  const [paymentMonth, setPaymentMonth] = useState("");

  // 契約書希望
  const [contractFormat, setContractFormat] = useState("electronic");

  // ステップ2: 利用規約スクロール
  const termsRef = useRef<HTMLDivElement>(null);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  // ステップ3: iPSサービス契約書スクロール
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

  // 申込時の健康情報をプリフィル
  useEffect(() => {
    if (status !== "authenticated" || healthLoaded) return;
    fetch("/api/member/health-info")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setHealthData({
            currentIllness: data.currentIllness ?? false,
            currentIllnessDetail: data.currentIllnessDetail ?? "",
            pastIllness: data.pastIllness ?? false,
            pastIllnessDetail: data.pastIllnessDetail ?? "",
            currentMedication: data.currentMedication ?? false,
            currentMedicationDetail: data.currentMedicationDetail ?? "",
            chronicDisease: data.chronicDisease ?? false,
            chronicDiseaseDetail: data.chronicDiseaseDetail ?? "",
            infectiousDisease: data.infectiousDisease ?? false,
            infectiousDiseaseDetail: data.infectiousDiseaseDetail ?? "",
            pregnancy: data.pregnancy ?? false,
            allergy: data.allergy ?? false,
            allergyDetail: data.allergyDetail ?? "",
            otherHealth: data.otherHealth ?? false,
            otherHealthDetail: data.otherHealthDetail ?? "",
          });
        }
        setHealthLoaded(true);
      })
      .catch(() => setHealthLoaded(true));
  }, [status, healthLoaded]);

  // 利用規約スクロール検知
  const handleTermsScroll = () => {
    if (!termsRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = termsRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setTermsScrolled(true);
    }
  };

  // iPSサービス契約書スクロール検知
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
          contractFormat,
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
        <h2 className="font-serif-jp text-xl sm:text-2xl font-normal text-text-primary tracking-wider mb-4">
          iPSサービス申込
        </h2>
        <GoldDivider />
      </div>

      {/* ステップインジケーター */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
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
            {s < 4 && (
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
            <h3 className="text-sm text-text-primary tracking-wider mb-3">事前確認事項（健康状態）</h3>
            <div className="bg-gold/5 border-l-2 border-gold px-4 py-3 rounded-r-md mb-5">
              <p className="text-[12px] sm:text-[13px] text-text-secondary leading-relaxed">
                iPS細胞作製にあたり、事前に適合確認のため現在の健康状態の確認をさせていただいております。メンバーシップ申込時より、健康状態に変更がある場合は、その旨ご記載ください。
              </p>
            </div>
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
                <span className="text-sm text-text-secondary">
                  妊娠中、もしくは妊娠の可能性がある
                  {!healthData.pregnancy && <span className="ml-2 text-[11px] text-text-muted font-normal">【なし】</span>}
                </span>
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

          {/* 契約書の希望 */}
          <div className="bg-bg-secondary border border-border rounded-md p-6">
            <h3 className="text-sm text-text-primary tracking-wider mb-4">契約書の形式</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="contractFormat" value="electronic" checked={contractFormat === "electronic"} onChange={(e) => setContractFormat(e.target.value)} className="accent-gold" />
                <span className="text-sm text-text-secondary">電子署名</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="contractFormat" value="paper" checked={contractFormat === "paper"} onChange={(e) => setContractFormat(e.target.value)} className="accent-gold" />
                <span className="text-sm text-text-secondary">紙の契約書</span>
              </label>
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
            次へ：利用規約の確認
          </button>
        </div>
      )}

      {/* ステップ2: 利用規約 */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-bg-secondary border border-border rounded-md p-6">
            <h3 className="text-sm text-text-primary tracking-wider mb-4">BioVault 会員規約</h3>
            <p className="text-xs text-text-muted mb-3">以下の利用規約をお読みいただき、同意のうえお進みください。</p>
            <div
              ref={termsRef}
              onScroll={handleTermsScroll}
              className="max-h-[50vh] overflow-y-auto border border-border rounded p-4 bg-bg-tertiary text-xs sm:text-sm text-text-secondary leading-[2] space-y-4"
            >
              <TermsContent />
            </div>

            {!termsScrolled && (
              <div className="mt-3 text-center text-xs text-gold animate-pulse">↓ 最後までスクロールしてください</div>
            )}

            <div className={`mt-4 transition-opacity ${termsScrolled ? "opacity-100" : "opacity-40"}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={termsAgreed} onChange={(e) => termsScrolled && setTermsAgreed(e.target.checked)} disabled={!termsScrolled} className="accent-gold w-4 h-4" />
                <span className="text-sm text-text-secondary">上記の BioVault会員規約の内容を確認し、同意します。</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setStep(1); window.scrollTo(0, 0); }} className="flex-1 py-3 border border-border text-text-secondary rounded text-sm hover:border-border-gold hover:text-gold transition-all cursor-pointer">
              戻る
            </button>
            <button
              onClick={() => { setStep(3); window.scrollTo(0, 0); }}
              disabled={!termsAgreed}
              className={`flex-1 py-3 rounded text-sm tracking-wider transition-all cursor-pointer ${termsAgreed ? "bg-gold-gradient text-bg-primary hover:opacity-90" : "bg-bg-elevated text-text-muted opacity-40 cursor-not-allowed"}`}
            >
              次へ：iPSサービス契約書
            </button>
          </div>
        </div>
      )}

      {/* ステップ3: iPSサービス契約書 */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-bg-secondary border border-border rounded-md p-6">
            <h3 className="text-sm text-text-primary tracking-wider mb-4">BioVault iPSサービス契約書</h3>
            <div
              ref={consentRef}
              onScroll={handleConsentScroll}
              className="max-h-[60vh] overflow-y-auto border border-border rounded p-4 bg-bg-tertiary text-xs sm:text-sm text-text-secondary leading-[2] space-y-5"
            >
              <p className="text-text-secondary/80 text-[11px]">（自家iPS細胞等の提供、保管、将来利用および死亡時取扱いに関する同意書）</p>
              <p>株式会社SCPP（以下「甲」という。）は、BioVaultメンバーシップ制サービスに関連して、メンバーシップ登録者本人（以下「乙」という。）に由来する血液、細胞その他の試料ならびにこれらから作製される自家iPS細胞その他関連物および関連情報の提供、保管、管理、将来利用、死亡時取扱いその他必要事項について、以下のとおり説明します。</p>
              <p>乙は、本書の内容を確認し、理解したうえで、これに同意するものとします。</p>

              <h4 className="text-sm text-text-primary font-medium">第1条（目的）</h4>
              <p>本同意書は、乙本人から採取された血液、細胞その他の試料を原料として作製される自家iPS細胞その他これに関連する細胞、加工物、検査記録および関連情報等の提供、保管、管理、利用条件、廃棄、死亡時取扱いその他必要事項を定めることを目的とします。</p>

              <h4 className="text-sm text-text-primary font-medium">第2条（適用関係）</h4>
              <p>本同意書は、BioVaultメンバーシップ契約書、BioVaultメンバーシップ規約、重要事項説明書兼確認書、申込確認書、個人情報・個人遺伝情報等の取扱いに関する同意書その他関連文書と一体をなすものとします。</p>

              <h4 className="text-sm text-text-primary font-medium">第3条（定義）</h4>
              <p>(1)「本試料」とは、乙本人から採取された血液、体液、細胞その他の生体由来試料をいいます。</p>
              <p>(2)「本細胞等」とは、本試料を原料として作製された自家iPS細胞、原料細胞、中間生成物、培養物、凍結保存物、加工物、検査試料、品質記録、識別情報その他これらに付随する一切の物および情報をいいます。</p>
              <p>(3)「関連生成物」とは、本細胞等から派生しまたは本細胞等を利用して得られる培養上清液その他の生成物をいいます。</p>
              <p>(4)「提携先」とは、本試料または本細胞等の採取、輸送、加工、培養、保管、品質管理、検査、払出し、廃棄、研究、再生医療等提供その他関連業務に関与する医療機関、細胞培養加工施設、検査機関、研究機関、物流事業者その他の甲提携先をいいます。</p>
              <p>(5)「保管サービス」とは、甲が乙向けに提供する、本細胞等の保管、管理、記録保存、照会対応その他の関連サービスをいいます。</p>

              <h4 className="text-sm text-text-primary font-medium">第4条（本同意書の位置付け）</h4>
              <p>本同意書は、本試料および本細胞等の提供、保管、管理、将来利用および死亡時の取扱いに関する乙本人の同意を確認するための文書です。</p>
              <p>甲は、BioVaultメンバーシップ制サービスの運営主体であり、乙に対し医療行為を直接提供するものではありません。</p>

              <h4 className="text-sm text-text-primary font-medium">第5条（本試料の提供）</h4>
              <p>乙は、本サービスの提供に必要な範囲で、本試料を提携医療機関または提携先に提供することに同意します。</p>

              <h4 className="text-sm text-text-primary font-medium">第6条（本細胞等の作製および保管）</h4>
              <p>乙は、本試料を原料として、本細胞等が提携先において作製、加工または保管される場合があることに同意します。</p>

              <h4 className="text-sm text-text-primary font-medium">第7条（保管の目的）</h4>
              <p>本細胞等の保管は、乙本人の将来利用可能性に備えることを主たる目的とします。</p>
              <p>甲および提携先は、本細胞等の保管が、特定の治療、美容上の効果、研究成果、経済的利益、商品化または資産的価値を保証するものでないことを明示します。</p>

              <h4 className="text-sm text-text-primary font-medium">第8条（保管期間）</h4>
              <p>本細胞等の基本保管期間は、乙が加入するプランまたは甲所定の申込条件に定める期間とします。</p>

              <h4 className="text-sm text-text-primary font-medium">第9条（保管方法および品質）</h4>
              <p>乙は、生体由来試料および細胞には個体差があり、採取条件、作製条件、保存環境その他の影響を受けるため、本細胞等の品質、増殖性、分化能、利用適合性その他の性状が常に一定であるとは限らないことをあらかじめ承諾します。</p>

              <h4 className="text-sm text-text-primary font-medium">第10条（提携先への委託および情報共有）</h4>
              <p>乙は、保管サービスの提供に必要な範囲で、甲が提携先との間で、本試料、本細胞等および関連情報を共有することに同意します。</p>

              <h4 className="text-sm text-text-primary font-medium">第11条（個人情報、要配慮個人情報および個人遺伝情報）</h4>
              <p>甲は、乙の個人情報、要配慮個人情報、個人遺伝情報、診療関連情報、検査結果、細胞識別情報、保管記録その他本試料または本細胞等に関連する情報を、保管サービスの提供、本人確認、品質管理、問い合わせ対応、費用請求、法令対応その他関連文書で定める目的のために利用します。</p>

              <h4 className="text-sm text-text-primary font-medium">第12条（将来利用および別途同意）</h4>
              <p>乙は、本細胞等が将来利用の可能性を見据えて保管されることを承諾します。</p>

              <h4 className="text-sm text-text-primary font-medium">第13条（払出し・移送）</h4>
              <p>乙が本細胞等の払出し、移送、利用申請その他を希望する場合には、甲所定の手続きおよび本人確認を経るものとします。</p>

              <h4 className="text-sm text-text-primary font-medium">第14条（変更届出）</h4>
              <p>乙は、氏名、住所、連絡先、緊急連絡先、死亡時意思表示その他甲所定の重要事項に変更が生じた場合には、遅滞なく甲に届け出るものとします。</p>

              <h4 className="text-sm text-text-primary font-medium">第15条（同意の撤回）</h4>
              <p>乙は、法令上撤回が制限される場合、既に不可逆的な処理が実施済みの部分、または安全管理上もしくは記録保存上保持が必要な部分を除き、将来に向かって本同意を撤回することができます。</p>

              <h4 className="text-sm text-text-primary font-medium">第16条（保管終了および廃棄）</h4>
              <p>甲または提携先は、保管期間が満了し更新がなされなかった場合、メンバーシップ資格が終了した場合、その他所定の事由に該当する場合、本細胞等の保管を終了し、廃棄その他必要な措置を講じることができます。</p>

              <h4 className="text-sm text-text-primary font-medium">第17条（死亡時の取扱い）</h4>
              <p>乙は、自身の死亡時における本細胞等の取扱いについて、あらかじめ次の各号のいずれかを選択するものとします。</p>
              <p>(1) 研究検体として研究機関へ寄贈する</p>
              <p>(2) 廃棄する</p>

              <h4 className="text-sm text-text-primary font-medium">第18条（非保証）</h4>
              <p>甲および提携先は、本細胞等の保管が、乙に対し、将来の特定の医療行為、美容行為、研究成果、経済的利益または資産的価値を保証するものではないことを明示します。</p>

              <h4 className="text-sm text-text-primary font-medium">第19条（免責）</h4>
              <p>甲は、その故意または重過失による場合を除き、生体由来試料の品質変化、外部要因に起因する影響、天災地変その他甲の合理的支配を超える事由により乙に生じた損害について責任を負いません。</p>

              <h4 className="text-sm text-text-primary font-medium">第20条（記録保存）</h4>
              <p>甲または提携先は、本試料または本細胞等に関する同意記録、管理記録、入出庫履歴、検査記録、問い合わせ履歴その他必要な情報を、法令または甲所定の保存期間に従い保存することができます。</p>

              <h4 className="text-sm text-text-primary font-medium">第21条（協議）</h4>
              <p>本同意書に定めのない事項または本同意書の解釈に疑義が生じた場合には、甲および乙は、誠実に協議して解決を図るものとします。</p>
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
                  上記のiPSサービス契約書の内容をすべて確認し、同意します
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStep(2); window.scrollTo(0, 0); }}
              className="flex-1 py-3 border border-border text-text-secondary rounded text-sm hover:border-border-gold hover:text-gold transition-all cursor-pointer"
            >
              戻る
            </button>
            <button
              onClick={() => { setStep(4); window.scrollTo(0, 0); }}
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

      {/* ステップ4: 最終確認 */}
      {step === 4 && (
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

              <div className="border-b border-border pb-3">
                <div className="text-xs text-text-muted mb-1">契約書の形式</div>
                <div className="text-sm text-text-primary">{contractFormat === "electronic" ? "電子署名" : "紙の契約書"}</div>
              </div>

              <div className="border-b border-border pb-3">
                <div className="text-xs text-text-muted mb-1">会員規約</div>
                <div className="text-sm text-text-primary">同意済み ✓</div>
              </div>

              <div>
                <div className="text-xs text-text-muted mb-1">iPSサービス契約書</div>
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
              onClick={() => { setStep(3); window.scrollTo(0, 0); }}
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
        <span className="text-sm text-text-secondary">
          {label}
          {!checked && <span className="ml-2 text-[11px] text-text-muted font-normal">【なし】</span>}
        </span>
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

// 利用規約コンテンツ
function TermsContent() {
  return (
    <>
      <TS t="第1条（目的）"><p>本規約は、株式会社SCPP（以下「当社」という。）が運営する「BioVault」に関し、会員に適用される利用条件、会員資格、運営上の取扱いその他必要事項を定めるものです。</p></TS>
      <TS t="第2条（定義）"><p>「本サービス」とは、当社が「BioVault」の名称で運営するBioVaultメンバーシップサービスおよびこれに付随する一切のサービスをいいます。</p><p>「会員」とは、当社所定の手続きにより本サービスの申込みを行い、当社が承認し、会員資格を付与された個人または法人をいいます。</p><p>「会員権」とは、本サービスの利用資格として当社が付与する地位をいいます。</p></TS>
      <TS t="第3条（本規約の適用）"><p>本規約は、会員と当社との間の本サービス利用に関する一切の関係に適用されます。</p></TS>
      <TS t="第4条（本サービスの位置付け）"><p>当社は、本サービスの運営主体であり、会員に対し医療行為を行うものではありません。</p></TS>
      <TS t="第5条（会員資格）"><p>会員資格は、当社が申込みを承認した時点で発生します。会員資格は会員本人に専属し、第三者へ譲渡できません。</p></TS>
      <TS t="第6条（本サービスの内容）"><p>本サービスの中核は、CellAssetに関する案内、申込管理、連絡調整、提供連携および関連する会員向け付随サービスとします。</p></TS>
      <TS t="第7条（会員限定サービス）"><p>当社は、会員に対し、情報配信サービス、個別相談またはコンシェルジュ案内、会員限定イベント等を提供することがあります。</p></TS>
      <TS t="第8条（会員情報の管理）"><p>会員は、届出情報に変更があった場合、速やかに届け出るものとします。</p></TS>
      <TS t="第9条（利用条件）"><p>本サービスは、会員本人のために提供されるものであり、第三者に利用させることはできません。</p></TS>
      <TS t="第10条（禁止事項）"><p>会員は、法令違反、虚偽申告、権利侵害、業務妨害、反社会的勢力への利益供与等を行ってはなりません。</p></TS>
      <TS t="第11条（知的財産権）"><p>本サービスに関連する知的財産権は、当社または正当な権利者に帰属します。</p></TS>
      <TS t="第12条（秘密保持）"><p>会員は、本サービスに関連して知り得た非公知情報を第三者に開示してはなりません。</p></TS>
      <TS t="第13条（個人情報等の取扱い）"><p>当社は、会員の個人情報を法令およびプライバシーポリシーに従って取り扱います。</p></TS>
      <TS t="第14条（情報配信）"><p>当社は、運営上必要な通知を電子メール等により行うことができます。</p></TS>
      <TS t="第15条（会員資格の停止・喪失）"><p>規約違反、虚偽申告、料金未払い等の場合、会員資格を停止または喪失させることができます。</p></TS>
      <TS t="第16条（退会）"><p>会員は、当社所定の方法により退会を申し出ることができます。</p></TS>
      <TS t="第17条（死亡時の取扱い）"><p>会員が死亡したときは、会員資格は当然に終了します。</p></TS>
      <TS t="第18条（規約の変更）"><p>当社は、法令改正等の事由がある場合、本規約を変更することができます。</p></TS>
      <TS t="第19条（免責）"><p>当社は、特定の結果、効果、効能を保証しません。天災等による損害について責任を負いません。</p></TS>
      <TS t="第20条（反社会的勢力の排除）"><p>会員は、反社会的勢力に該当しないことを表明し、保証します。</p></TS>
      <TS t="第21条（協議事項）"><p>本規約に定めのない事項は、誠実に協議して解決するものとします。</p></TS>
      <TS t="第22条（準拠法・管轄）"><p>本規約は日本法に準拠します。紛争が生じた場合、当社本店所在地を管轄する裁判所を専属的合意管轄裁判所とします。</p></TS>
    </>
  );
}

function TS({ t, children }: { t: string; children: React.ReactNode }) {
  return (<section><h4 className="text-sm text-text-primary font-medium mb-1">{t}</h4><div className="space-y-1.5">{children}</div></section>);
}
