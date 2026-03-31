"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GoldDivider from "@/components/ui/GoldDivider";

export default function ApplyPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-primary" />}>
      <ApplyPage />
    </Suspense>
  );
}

function ApplyPage() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    // 1. 申込者情報
    name: "",
    nameKana: "",
    dateOfBirth: "",
    postalCode: "",
    address: "",
    phone: "",
    email: "",
    occupation: "",
    // 2. 申込内容
    paymentMethod: "bank_transfer",
    paymentMethodOther: "",
    paymentDate: "",
    referrerName: "",
    salesRepName: "",
    // 3. 健康状態
    currentIllness: false,
    currentIllnessDetail: "",
    pastIllness: false,
    pastIllnessDetail: "",
    currentMedication: false,
    currentMedicationDetail: "",
    chronicDisease: false,
    chronicDiseaseDetail: "",
    infectiousDisease: false,
    infectiousDiseaseDetail: "",
    pregnancy: false,
    allergy: false,
    allergyDetail: "",
    otherHealth: false,
    otherHealthDetail: "",
    // 4. 確認事項
    confirmNotMedical: false,
    confirmScppRole: false,
    confirmClinicRole: false,
    confirmLabRole: false,
    confirmDocuments: false,
    // 5. 受領確認
    receivedContract: false,
    receivedTerms: false,
    receivedImportant: false,
    receivedMedicalCheck: false,
    receivedPrivacy: false,
    receivedCellStorage: false,
    receivedIpsConsent: false,
  });

  const update = (field: string, value: unknown) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, referredByAgency: refCode }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "送信に失敗しました");
      } else {
        setDone(true);
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <PageWrapper>
        <div className="text-center py-16">
          <div className="text-5xl mb-6">✓</div>
          <h2 className="font-serif-jp text-xl text-gold mb-3">お申込みを受け付けました</h2>
          <p className="text-sm text-text-secondary leading-relaxed max-w-md mx-auto">
            ご登録いただいたメールアドレスに確認メールをお送りいたします。
            <br />
            担当者より改めてご連絡させていただきます。
          </p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="text-center mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="BioVault" className="h-8 w-auto mx-auto mb-4" />
        <h1 className="font-serif-jp text-lg sm:text-xl text-text-primary tracking-[2px] mb-2">
          BioVault メンバーシップ 申込書
        </h1>
        <GoldDivider width={60} className="mx-auto mb-3" />
        <p className="text-xs text-text-muted leading-relaxed max-w-lg mx-auto text-left sm:text-center">
          本申込書に記載した内容は、会員契約手続き、提携医療機関等による問診・適格確認、細胞作製・保管に関する各種手続きの参考資料として利用されます。
        </p>
      </div>

      {/* ステップインジケーター */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono ${
                step === s
                  ? "bg-gold text-bg-primary font-bold"
                  : step > s
                  ? "bg-gold/20 text-gold"
                  : "bg-bg-elevated text-text-muted"
              }`}
            >
              {step > s ? "✓" : s}
            </div>
            {s < 5 && <div className={`w-6 h-[1px] ${step > s ? "bg-gold/30" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-xs text-center">
          {error}
        </div>
      )}

      {/* Step 1: 申込者情報 */}
      {step === 1 && (
        <FormSection title="1. 申込者情報">
          <Field label="氏名" required>
            <NameInput value={form.name} onChange={(v) => update("name", v)} onKana={(v) => update("nameKana", v)} />
            <div className="text-[10px] text-text-muted mt-1">※ 姓と名の間にスペースを入れてください（例: 山田 太郎）</div>
          </Field>
          <Field label="フリガナ（カタカナ）" required>
            <input
              value={form.nameKana}
              onChange={(e) => {
                // ひらがな→カタカナ自動変換、カタカナ・スペースのみ許可
                const converted = e.target.value.replace(/[\u3041-\u3096]/g, (ch) =>
                  String.fromCharCode(ch.charCodeAt(0) + 0x60)
                );
                update("nameKana", converted);
              }}
              placeholder="ヤマダ タロウ"
              required
              className={inputClass}
            />
            <div className="text-[10px] text-text-muted mt-1">ひらがなで入力すると自動でカタカナに変換されます</div>
          </Field>
          <Field label="生年月日" required>
            <input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} required className={inputClass} />
          </Field>
          <Field label="郵便番号">
            <PostalCodeInput value={form.postalCode} onChange={(v) => update("postalCode", v)} onAddress={(v) => update("address", v)} />
          </Field>
          <Field label="住所" required>
            <input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="東京都港区..." required className={inputClass} />
          </Field>
          <Field label="電話番号（ハイフンなし）" required>
            <input
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="09012345678"
              required
              maxLength={11}
              className={inputClass + " font-mono tracking-wider"}
            />
          </Field>
          <Field label="メールアドレス" required>
            <EmailInput value={form.email} onChange={(v) => update("email", v)} />
          </Field>
          <Field label="職業">
            <select value={form.occupation} onChange={(e) => update("occupation", e.target.value)} className={inputClass + " cursor-pointer"}>
              <option value="">選択してください</option>
              <optgroup label="経営・役員">
                <option value="会社経営者">会社経営者</option>
                <option value="会社役員">会社役員</option>
              </optgroup>
              <optgroup label="会社員・団体職員">
                <option value="会社員（管理職）">会社員（管理職）</option>
                <option value="会社員（一般）">会社員（一般）</option>
                <option value="団体職員">団体職員</option>
                <option value="公務員">公務員</option>
              </optgroup>
              <optgroup label="専門職">
                <option value="医師">医師</option>
                <option value="歯科医師">歯科医師</option>
                <option value="薬剤師">薬剤師</option>
                <option value="看護師">看護師</option>
                <option value="弁護士">弁護士</option>
                <option value="公認会計士・税理士">公認会計士・税理士</option>
                <option value="建築士">建築士</option>
                <option value="その他士業">その他士業</option>
              </optgroup>
              <optgroup label="自営・フリーランス">
                <option value="自営業">自営業</option>
                <option value="フリーランス">フリーランス</option>
                <option value="農林水産業">農林水産業</option>
              </optgroup>
              <optgroup label="その他">
                <option value="不動産オーナー">不動産オーナー</option>
                <option value="投資家">投資家</option>
                <option value="年金生活者">年金生活者</option>
                <option value="主婦・主夫">主婦・主夫</option>
                <option value="学生">学生</option>
                <option value="無職">無職</option>
                <option value="その他">その他</option>
              </optgroup>
            </select>
          </Field>
          <StepNav onNext={() => setStep(2)} />
        </FormSection>
      )}

      {/* Step 2: 申込内容 + 健康状態 */}
      {step === 2 && (
        <FormSection title="2. 申込内容 / 3. 事前確認事項">
          <Field label="会員価格">
            <div className={`${inputClass} text-gold`}>8,800,000円（税込）</div>
          </Field>
          <Field label="支払方法">
            <select value={form.paymentMethod} onChange={(e) => update("paymentMethod", e.target.value)} className={inputClass}>
              <option value="bank_transfer">銀行振込</option>
              <option value="other">その他</option>
            </select>
          </Field>
          {form.paymentMethod === "other" && (
            <Field label="その他の支払方法">
              <input value={form.paymentMethodOther} onChange={(e) => update("paymentMethodOther", e.target.value)} className={inputClass} />
            </Field>
          )}
          <Field label="支払予定日">
            <input type="date" value={form.paymentDate} onChange={(e) => update("paymentDate", e.target.value)} className={inputClass} />
          </Field>
          <Field label="紹介者名／代理店名">
            <input value={form.referrerName} onChange={(e) => update("referrerName", e.target.value)} className={inputClass} />
          </Field>
          <Field label="担当営業者名">
            <input value={form.salesRepName} onChange={(e) => update("salesRepName", e.target.value)} className={inputClass} />
          </Field>

          <div className="border-t border-border mt-6 pt-6">
            <h4 className="text-sm text-gold mb-3">健康状態の自己申告</h4>
            <div className="text-[11px] text-text-muted mb-5 space-y-1 leading-relaxed">
              <p>※ 以下は、提携医療機関等による問診・適格確認の参考情報として確認するものです。</p>
              <p>※ 申込時点での自己申告であり、最終的な導入可否・採血可否・作製可否は提携医療機関または提携先の判断によります。</p>
            </div>

            <HealthCheck label="(1) 現在治療中の病気" checked={form.currentIllness} onChange={(v) => update("currentIllness", v)} detail={form.currentIllnessDetail} onDetail={(v) => update("currentIllnessDetail", v)} placeholder="病名・内容" />
            <HealthCheck label="(2) 過去に大きな病気や手術歴" checked={form.pastIllness} onChange={(v) => update("pastIllness", v)} detail={form.pastIllnessDetail} onDetail={(v) => update("pastIllnessDetail", v)} placeholder="内容" />
            <HealthCheck label="(3) 現在使用中の薬" checked={form.currentMedication} onChange={(v) => update("currentMedication", v)} detail={form.currentMedicationDetail} onDetail={(v) => update("currentMedicationDetail", v)} placeholder="薬名・内容" />
            <HealthCheck label="(4) 持病の有無" checked={form.chronicDisease} onChange={(v) => update("chronicDisease", v)} detail={form.chronicDiseaseDetail} onDetail={(v) => update("chronicDiseaseDetail", v)} placeholder="内容" />
            <HealthCheck label="(5) 感染症の罹患状況・既往" checked={form.infectiousDisease} onChange={(v) => update("infectiousDisease", v)} detail={form.infectiousDiseaseDetail} onDetail={(v) => update("infectiousDiseaseDetail", v)} placeholder="内容" />
            <HealthCheck label="(6) 妊娠中または妊娠の可能性" checked={form.pregnancy} onChange={(v) => update("pregnancy", v)} />
            <HealthCheck label="(7) アレルギーの有無" checked={form.allergy} onChange={(v) => update("allergy", v)} detail={form.allergyDetail} onDetail={(v) => update("allergyDetail", v)} placeholder="内容" />
            <HealthCheck label="(8) その他、健康上の事項" checked={form.otherHealth} onChange={(v) => update("otherHealth", v)} detail={form.otherHealthDetail} onDetail={(v) => update("otherHealthDetail", v)} placeholder="内容" />
          </div>
          <StepNav onBack={() => setStep(1)} onNext={() => setStep(3)} />
        </FormSection>
      )}

      {/* Step 3: 確認事項 + 受領文書 */}
      {step === 3 && (
        <FormSection title="4. 確認事項">
          <p className="text-xs text-text-secondary mb-4">
            以下の事項を確認し、理解したうえで申込みます。
          </p>
          <Checkbox checked={form.confirmNotMedical} onChange={(v) => update("confirmNotMedical", v)} label="本サービスは、医療行為そのものの直接提供契約ではないこと" />
          <Checkbox checked={form.confirmScppRole} onChange={(v) => update("confirmScppRole", v)} label="株式会社SCPPは、本サービスの運営主体であり、医療行為の実施主体ではないこと" />
          <Checkbox checked={form.confirmClinicRole} onChange={(v) => update("confirmClinicRole", v)} label="診察、問診、採血、医学的判断等は提携医療機関等が行うこと" />
          <Checkbox checked={form.confirmLabRole} onChange={(v) => update("confirmLabRole", v)} label="細胞作製、培養、品質評価、保管等は提携先機関が行うこと" />
          <Checkbox checked={form.confirmDocuments} onChange={(v) => update("confirmDocuments", v)} label="本申込に関連して、関連文書が一体として適用されること" />
          <StepNav onBack={() => setStep(2)} onNext={() => setStep(4)} />
        </FormSection>
      )}

      {/* Step 4: 利用規約 */}
      {step === 4 && (
        <TermsStep onBack={() => setStep(3)} onNext={() => setStep(5)} />
      )}

      {/* Step 5: 確認・送信 */}
      {step === 5 && (
        <FormSection title="入力内容の確認">
          <div className="space-y-4 mb-6">
            <ConfirmGroup title="申込者情報">
              <ConfirmRow label="氏名" value={form.name} />
              <ConfirmRow label="フリガナ" value={form.nameKana} />
              <ConfirmRow label="生年月日" value={form.dateOfBirth} />
              <ConfirmRow label="住所" value={`〒${form.postalCode || "---"} ${form.address}`} />
              <ConfirmRow label="電話番号" value={form.phone} />
              <ConfirmRow label="メール" value={form.email} />
              <ConfirmRow label="職業" value={form.occupation || "---"} />
            </ConfirmGroup>
            <ConfirmGroup title="申込内容">
              <ConfirmRow label="支払方法" value={form.paymentMethod === "bank_transfer" ? "銀行振込" : form.paymentMethodOther || "その他"} />
              <ConfirmRow label="支払予定日" value={form.paymentDate || "---"} />
              <ConfirmRow label="紹介者" value={form.referrerName || "---"} />
              <ConfirmRow label="営業担当" value={form.salesRepName || "---"} />
            </ConfirmGroup>
          </div>

          <p className="text-xs text-text-secondary text-center mb-6 leading-relaxed">
            本申込書の内容を真実かつ正確に記載し、上記各事項を確認・理解のうえ、
            <br />
            BioVaultメンバーシップに申し込みます。
          </p>

          <div className="flex gap-3">
            <button onClick={() => setStep(4)} className="flex-1 py-3.5 bg-transparent border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold transition-all">
              戻る
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-sm font-semibold tracking-wider cursor-pointer transition-all hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "送信中..." : "申込みを送信する"}
            </button>
          </div>
        </FormSection>
      )}
    </PageWrapper>
  );
}

// ── 共通コンポーネント ──

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans">
      <div className="max-w-lg mx-auto px-4 py-10 sm:py-16">{children}</div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-7">
      <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-5 pb-3 border-b border-border">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="block text-xs text-text-secondary tracking-wider mb-2">
        {label}{required && <span className="text-status-danger ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function HealthCheck({ label, checked, onChange, detail, onDetail, placeholder }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; detail?: string; onDetail?: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="mb-4">
      <div className="text-xs text-text-primary mb-2">{label}</div>
      <div className="flex gap-4 mb-2">
        <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
          <input type="radio" checked={!checked} onChange={() => onChange(false)} className="cursor-pointer" /> なし
        </label>
        <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
          <input type="radio" checked={checked} onChange={() => onChange(true)} className="cursor-pointer" /> あり
        </label>
      </div>
      {checked && onDetail && (
        <input value={detail || ""} onChange={(e) => onDetail(e.target.value)} placeholder={placeholder} className={inputClass} />
      )}
    </div>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-start gap-3 mb-3 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 cursor-pointer shrink-0" />
      <span className="text-xs text-text-secondary leading-relaxed">{label}</span>
    </label>
  );
}

function StepNav({ onBack, onNext }: { onBack?: () => void; onNext?: () => void }) {
  return (
    <div className="flex gap-3 mt-6">
      {onBack && (
        <button onClick={onBack} className="flex-1 py-3 bg-transparent border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold transition-all">戻る</button>
      )}
      {onNext && (
        <button onClick={onNext} className="flex-1 py-3 bg-gold-gradient border-none rounded-sm text-bg-primary text-sm font-semibold tracking-wider cursor-pointer transition-all hover:opacity-90">次へ</button>
      )}
    </div>
  );
}

function ConfirmGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-elevated rounded-md p-4">
      <div className="text-[11px] text-gold mb-2">{title}</div>
      {children}
    </div>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex py-1.5 border-b border-border last:border-b-0">
      <div className="w-24 text-[11px] text-text-muted shrink-0">{label}</div>
      <div className="text-xs text-text-primary">{value}</div>
    </div>
  );
}

// ── 利用規約スクロール同意ステップ ──
function TermsStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setScrolledToBottom(true);
      }
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <FormSection title="5. BioVault会員規約">
      <p className="text-xs text-text-muted mb-3">以下の利用規約をお読みいただき、同意のうえお進みください。</p>

      <div ref={scrollRef} className="max-h-[50vh] overflow-y-auto bg-bg-elevated border border-border rounded-md p-4 sm:p-5 mb-4">
        <article className="text-xs text-text-secondary leading-[2] space-y-4">
          <TermsSection title="第1条（目的）">
            <p>本規約は、株式会社SCPP（以下「当社」という。）が運営する「BioVault」に関し、会員に適用される利用条件、会員資格、運営上の取扱いその他必要事項を定めるものです。</p>
          </TermsSection>
          <TermsSection title="第2条（定義）">
            <p>「本サービス」とは、当社が「BioVault」の名称で運営するBioVaultメンバーシップサービスおよびこれに付随する一切のサービスをいいます。</p>
            <p>「会員」とは、当社所定の手続きにより本サービスの申込みを行い、当社が承認し、会員資格を付与された個人または法人をいいます。</p>
            <p>「会員権」とは、本サービスの利用資格として当社が付与する地位をいいます。</p>
            <p>「CellAsset」とは、会員本人に由来する血液その他検体に関して、提携先における細胞の作製、加工、保管その他関連手続きの実施に向けた案内、申込管理、日程調整、情報提供および運営上の連携サービスをいいます。</p>
            <p>「提携先」とは、医療機関、検査機関、加工施設、保管施設、配送事業者、決済関連事業者その他本サービス提供に関連する第三者をいいます。</p>
          </TermsSection>
          <TermsSection title="第3条（本規約の適用）">
            <p>本規約は、会員と当社との間の本サービス利用に関する一切の関係に適用されます。</p>
            <p>関連文書は、本規約と一体として適用されます。</p>
          </TermsSection>
          <TermsSection title="第4条（本サービスの位置付け）">
            <p>当社は、本サービスの運営主体であり、会員に対し医療行為を行うものではありません。</p>
            <p>診察、問診、採血、医学的判断、施術その他の医療行為は、提携医療機関またはその所属医師等が、その責任において行うものとします。</p>
            <p>本サービスは、特定の美容上、健康上、医療上または将来の治療機会を保証するものではありません。</p>
          </TermsSection>
          <TermsSection title="第5条（会員資格）">
            <p>会員資格は、当社が申込みを承認した時点で発生します。</p>
            <p>会員資格は会員本人に専属し、当社の事前の書面承諾なく第三者へ譲渡、貸与、担保設定その他の処分をすることはできません。</p>
            <p>会員資格は、相続、承継または名義変更の対象とはなりません。</p>
          </TermsSection>
          <TermsSection title="第6条（本サービスの内容）">
            <p>本サービスの中核は、CellAssetに関する案内、申込管理、連絡調整、提供連携および関連する会員向け付随サービスとします。</p>
          </TermsSection>
          <TermsSection title="第7条（会員限定サービス）">
            <p>当社は、会員に対し、情報配信サービス、個別相談またはコンシェルジュ案内、会員限定イベント、提携先優待または紹介サービス、その他当社が別途定めるサービスを提供または案内することがあります。</p>
          </TermsSection>
          <TermsSection title="第8条（会員情報の管理）">
            <p>会員は、当社に届け出た氏名、住所、連絡先、メールアドレスその他の情報に変更があった場合、速やかに当社所定の方法で届け出るものとします。</p>
          </TermsSection>
          <TermsSection title="第9条（利用条件）">
            <p>会員は、本サービスを、自らの備え、情報取得、会員特典利用その他当社が想定する目的の範囲で利用するものとします。</p>
            <p>本サービスは、会員本人のために提供されるものであり、当社の事前承諾なく第三者に利用させることはできません。</p>
          </TermsSection>
          <TermsSection title="第10条（禁止事項）">
            <p>会員は、次の各号の行為をしてはなりません。</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>法令または公序良俗に反する行為</li>
              <li>虚偽の申告または重要事項の不申告</li>
              <li>当社、提携先、他の会員または第三者の信用、名誉、権利または利益を侵害する行為</li>
              <li>当社または提携先の業務運営を妨げる行為</li>
              <li>本サービスに関連して取得した情報、資料、ノウハウ等を無断で転載、複製、販売、第三者提供または営業利用する行為</li>
              <li>反社会的勢力に利益供与し、またはこれに関与する行為</li>
              <li>その他当社が合理的理由に基づき不適切と判断する行為</li>
            </ul>
          </TermsSection>
          <TermsSection title="第11条（知的財産権）">
            <p>本サービスに関連して当社または提携先が提供する資料、文章、画像、動画、商標、ノウハウ、システムその他一切の知的財産権は、当社または正当な権利者に帰属します。</p>
          </TermsSection>
          <TermsSection title="第12条（秘密保持）">
            <p>会員は、本サービスに関連して知り得た当社または提携先の営業上、技術上、運営上その他一切の非公知情報を、当社の事前承諾なく第三者に開示または漏えいしてはなりません。</p>
          </TermsSection>
          <TermsSection title="第13条（個人情報等の取扱い）">
            <p>当社は、会員の個人情報、要配慮個人情報、個人遺伝情報、検査結果、問診情報、細胞に関する情報その他本サービスに関連して取得する情報を、法令、関連文書および当社所定のプライバシーポリシーに従って取り扱います。</p>
          </TermsSection>
          <TermsSection title="第14条（情報配信）">
            <p>当社は、会員に対し、本サービスの運営上必要な通知、日程調整、契約管理、重要なお知らせ等を、電子メール、書面、電話、メッセージ配信その他相当な方法により行うことができます。</p>
          </TermsSection>
          <TermsSection title="第15条（会員資格の停止・喪失）">
            <p>当社は、会員が本規約、会員契約書または関連文書に違反した場合、申告内容に重大な虚偽があった場合、料金の支払を遅滞した場合、反社会的勢力に該当した場合、その他本サービスの運営上重大な支障がある場合、会員資格を停止し、または喪失させることができます。</p>
          </TermsSection>
          <TermsSection title="第16条（会員による退会等）">
            <p>会員は、当社所定の方法により退会または解約を申し出ることができます。</p>
            <p>退会または解約に伴う返金、控除、未実施部分の精算その他の条件は、会員契約書および重要事項説明書の定めに従います。</p>
          </TermsSection>
          <TermsSection title="第17条（死亡時の取扱い）">
            <p>会員が個人である場合において、当該会員が死亡したときは、その会員資格は当然に終了します。</p>
          </TermsSection>
          <TermsSection title="第18条（規約の変更）">
            <p>当社は、法令改正、監督官庁の指導、提携条件の変更、サービス内容の合理的見直し、運営上の必要その他相当の事由がある場合、本規約を変更することができます。</p>
          </TermsSection>
          <TermsSection title="第19条（免責）">
            <p>当社は、本サービスに関して、特定の美容上、健康上、医療上、経済上またはその他の結果、効果、効能を保証しません。</p>
            <p>当社は、天災、感染症、行政指導、法令改正、交通事情、通信障害、システム障害その他当社の合理的支配を超える事情により生じた損害について責任を負いません。</p>
          </TermsSection>
          <TermsSection title="第20条（反社会的勢力の排除）">
            <p>会員は、自らまたは自らの役員、実質的支配者その他関係者が、反社会的勢力に該当せず、また将来にわたっても該当しないことを表明し、保証します。</p>
          </TermsSection>
          <TermsSection title="第21条（協議事項）">
            <p>本規約に定めのない事項または本規約の解釈に疑義が生じた場合、当社と会員は誠実に協議して解決するものとします。</p>
          </TermsSection>
          <TermsSection title="第22条（準拠法・管轄）">
            <p>本規約は、日本法に準拠し、日本法に従って解釈されます。</p>
            <p>本規約または本サービスに関して紛争が生じた場合、当社本店所在地を管轄する地方裁判所または簡易裁判所を第一審の専属的合意管轄裁判所とします。</p>
          </TermsSection>
        </article>
      </div>

      {!scrolledToBottom && (
        <p className="text-xs text-text-muted text-center mb-3 animate-pulse">↓ 最後までスクロールしてください</p>
      )}

      <label className={`flex items-start gap-3 mb-4 ${scrolledToBottom ? "cursor-pointer" : "opacity-40 pointer-events-none"}`}>
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} disabled={!scrolledToBottom} className="mt-0.5 cursor-pointer shrink-0" />
        <span className="text-sm text-text-primary leading-relaxed">上記の BioVault会員規約の内容を確認し、同意します。</span>
      </label>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 bg-transparent border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold transition-all">戻る</button>
        <button onClick={onNext} disabled={!agreed} className="flex-1 py-3 bg-gold-gradient border-none rounded-sm text-bg-primary text-sm font-semibold tracking-wider cursor-pointer transition-all hover:opacity-90 disabled:opacity-30">次へ</button>
      </div>
    </FormSection>
  );
}

function TermsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs text-text-primary font-medium mb-1">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

const inputClass = "w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold";

// ── 氏名入力（inputイベントのinputTypeでIME変換前のひらがなを検出） ──
function NameInput({
  value,
  onChange,
  onKana,
}: {
  value: string;
  onChange: (v: string) => void;
  onKana: (v: string) => void;
}) {
  const confirmedKana = useRef("");
  const isComposing = useRef(false);
  const lastCompositionData = useRef("");

  const handleCompositionStart = () => {
    isComposing.current = true;
    lastCompositionData.current = "";
  };

  const handleCompositionUpdate = (e: React.CompositionEvent<HTMLInputElement>) => {
    if (e.data) {
      // compositionUpdate のデータにひらがなが含まれているか確認
      const hasHiragana = /[\u3041-\u3096]/.test(e.data);
      if (hasHiragana) {
        // ひらがなが含まれていればそれをカタカナに変換して保持
        lastCompositionData.current = toKatakana(e.data);
      }
      // ひらがなが無い場合（漢字変換候補）は前回のひらがなを維持
    }
  };

  const handleCompositionEnd = () => {
    isComposing.current = false;
    if (lastCompositionData.current) {
      confirmedKana.current += lastCompositionData.current;
      lastCompositionData.current = "";
      onKana(confirmedKana.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isComposing.current) {
      if (e.key === " " || e.key === "　") {
        confirmedKana.current += " ";
        onKana(confirmedKana.current);
      }
      if (e.key === "Backspace") {
        confirmedKana.current = confirmedKana.current.slice(0, -1);
        onKana(confirmedKana.current);
      }
    }
  };

  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onCompositionStart={handleCompositionStart}
      onCompositionUpdate={handleCompositionUpdate}
      onCompositionEnd={handleCompositionEnd}
      onKeyDown={handleKeyDown}
      placeholder="山田 太郎"
      required
      className={inputClass}
    />
  );
}

// ひらがな→カタカナ変換
function toKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  );
}

// ── 郵便番号入力（自動住所検索） ──
function PostalCodeInput({
  value,
  onChange,
  onAddress,
}: {
  value: string;
  onChange: (v: string) => void;
  onAddress: (v: string) => void;
}) {
  const [searching, setSearching] = useState(false);

  const handleChange = async (raw: string) => {
    // 数字のみ許可、7桁でハイフン自動挿入
    const digits = raw.replace(/[^0-9]/g, "").slice(0, 7);
    let formatted = digits;
    if (digits.length > 3) {
      formatted = digits.slice(0, 3) + "-" + digits.slice(3);
    }
    onChange(formatted);

    // 7桁揃ったら住所検索
    if (digits.length === 7) {
      setSearching(true);
      try {
        const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const r = data.results[0];
          onAddress(`${r.address1}${r.address2}${r.address3}`);
        }
      } catch {
        // 検索失敗は無視
      } finally {
        setSearching(false);
      }
    }
  };

  return (
    <div className="relative">
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="000-0000"
        maxLength={8}
        className={inputClass + " font-mono"}
      />
      {searching && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-text-muted">
          検索中...
        </span>
      )}
    </div>
  );
}

// ── メールアドレス入力（リアルタイム重複チェック） ──
function EmailInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [emailError, setEmailError] = useState("");
  const [checking, setChecking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkEmail = async (email: string) => {
    if (!email || !email.includes("@")) {
      setEmailError("");
      return;
    }
    setChecking(true);
    try {
      const res = await fetch("/api/apply/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.available) {
        setEmailError(data.error || "このメールアドレスは使用できません");
      } else {
        setEmailError("");
      }
    } catch {
      // チェック失敗は無視
    } finally {
      setChecking(false);
    }
  };

  const handleChange = (email: string) => {
    onChange(email);
    setEmailError("");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => checkEmail(email), 500);
  };

  return (
    <div>
      <div className="relative">
        <input
          type="email"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="your@email.com"
          required
          className={`${inputClass} ${emailError ? "border-status-danger" : ""}`}
        />
        {checking && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-text-muted">確認中...</span>
        )}
      </div>
      {emailError && (
        <div className="text-[11px] text-status-danger mt-1">{emailError}</div>
      )}
    </div>
  );
}
