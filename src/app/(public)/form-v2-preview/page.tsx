/**
 * /form-v2-preview
 *
 * デザイン刷新版(v2)の申請フォーム。
 *
 * - 本番フォーム /form/app/page.tsx の機能ロジック(state管理・バリデーション・
 *   住所検索・メール重複チェック・送信処理・サンクス画面・テスター用リダイレクト等)
 *   をそのまま移植し、UI のみ v2 デザイン(v2-theme.css)へ置き換えたページ。
 * - 送信先 API は本番と同じ /api/apply。
 * - スキーム判定(SCPP/MRT)・クエリパラメータ(?ref/?staff/?rep)対応も継承。
 * - 本番フォーム /form/app/page.tsx には一切影響しません。
 */

"use client";

import { useState, useRef, useEffect, Suspense, Fragment } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import V2Wrapper from "@/components/form-v2/V2Wrapper";
import V2Button from "@/components/form-v2/V2Button";
import ThanksContent from "@/components/form-v2/ThanksContent";
import { detectSchemeFromPath } from "@/lib/scheme";

export default function FormV2PreviewPageWrapper() {
  return (
    <Suspense
      fallback={
        <V2Wrapper>
          <div style={{ minHeight: "60vh" }} />
        </V2Wrapper>
      }
    >
      <FormV2PreviewPage />
    </Suspense>
  );
}

function FormV2PreviewPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const refCode = searchParams.get("ref") || "";
  const staffCode = searchParams.get("staff") || "";
  const repName = searchParams.get("rep") || "";
  // 流入スキーム判定(/m/ 配下 → MRT、それ以外 → SCPP)
  const scheme = detectSchemeFromPath(pathname);

  const [step, setStepRaw] = useState(1);
  const setStep = (s: number) => {
    setStepRaw(s);
    setTimeout(() => window.scrollTo(0, 0), 50);
  };
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [testerRedirect, setTesterRedirect] = useState<{ loginId: string; password: string } | null>(null);
  const [testerCountdown, setTesterCountdown] = useState(3);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    // 1. 申請者情報
    name: "",
    nameKana: "",
    dateOfBirth: "1980-01-01",
    postalCode: "",
    address: "",
    phone: "",
    email: "",
    occupation: "",
    // 2. 健康状態
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
    // 3. 同意
    confirmNotMedical: false,
    // (本番フォームに残っている未使用フィールドは送信ペイロードの互換性維持のため保持)
    confirmScppRole: false,
    confirmClinicRole: false,
    confirmLabRole: false,
    // 受領確認(本番互換のため保持)
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
        body: JSON.stringify({
          ...form,
          referredByAgency: refCode,
          staffCode,
          salesRepName: repName,
          scheme,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "送信に失敗しました");
      } else if (data.isTester) {
        setTesterRedirect({ loginId: data.loginId, password: data.tempPassword });
      } else {
        setDone(true);
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  // テスター: サンクスページ表示 → 3秒後にログインページへリダイレクト
  useEffect(() => {
    if (!testerRedirect) return;
    if (testerCountdown <= 0) {
      window.location.href = `/login?tid=${encodeURIComponent(testerRedirect.loginId)}&tpw=${encodeURIComponent(testerRedirect.password)}`;
      return;
    }
    const timer = setTimeout(() => setTesterCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [testerRedirect, testerCountdown]);

  // ──────────────────────────────────────────────
  // テスター用 サンクス画面
  // ──────────────────────────────────────────────
  if (testerRedirect) {
    return (
      <V2Wrapper scheme={scheme}>
        <div className="v2-form-container" style={{ paddingTop: 56, paddingBottom: 56 }}>
          <section className="v2-section" style={{ marginTop: 0, textAlign: "center" }}>
            <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 16, color: "var(--v2-success)" }}>✓</div>
            <h2
              style={{
                fontFamily: '"Noto Serif JP", serif',
                fontSize: 22,
                fontWeight: 700,
                color: "var(--v2-text-primary)",
                marginBottom: 16,
                letterSpacing: "0.04em",
              }}
            >
              テストアカウントを作成しました
            </h2>
            <div
              style={{
                backgroundColor: "var(--v2-bg-elevated)",
                border: "1px solid var(--v2-gold-border)",
                borderRadius: "var(--v2-radius-sm)",
                padding: 16,
                textAlign: "left",
                maxWidth: 360,
                margin: "0 auto 16px",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--v2-text-muted)", marginBottom: 4 }}>ログインID</div>
              <div
                style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: 18,
                  color: "var(--v2-gold-dark)",
                  letterSpacing: "0.08em",
                  marginBottom: 12,
                }}
              >
                {testerRedirect.loginId}
              </div>
              <div style={{ fontSize: 12, color: "var(--v2-text-muted)", marginBottom: 4 }}>パスワード</div>
              <div
                style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: 18,
                  color: "var(--v2-gold-dark)",
                  letterSpacing: "0.08em",
                }}
              >
                {testerRedirect.password}
              </div>
            </div>
            <p style={{ fontSize: 13, color: "var(--v2-text-muted)" }}>
              <span style={{ color: "var(--v2-gold-dark)", fontWeight: 700 }}>{testerCountdown}秒後</span>
              にログインページへ移動します...
            </p>
          </section>
        </div>
      </V2Wrapper>
    );
  }

  // ──────────────────────────────────────────────
  // 送信完了 サンクス画面
  // ──────────────────────────────────────────────
  if (done) {
    return (
      <V2Wrapper
        scheme={scheme}
        headerWide
        title={
          <>
            <span className="v2-banner-title-line">iPS細胞作製の</span>
            <span className="v2-banner-title-line">適合確認申請を</span>
            <br className="v2-banner-title-br-pc" />
            <span className="v2-banner-title-line">受け付けました</span>
          </>
        }
      >
        <ThanksContent scheme={scheme} />
      </V2Wrapper>
    );
  }

  // ──────────────────────────────────────────────
  // 申請フォーム本体
  // ──────────────────────────────────────────────
  return (
    <V2Wrapper
      scheme={scheme}
      title={
        <>
          iPS細胞作製
          <br />
          適合確認申請
        </>
      }
      heroImageSrc="/nagashima01.png"
      compact={step !== 1}
    >
      <div className="v2-form-container" style={{ paddingBottom: 48 }}>
        {error && <div className="v2-error">{error}</div>}

        {/* ──────────────── Step 1: 申請者情報 ──────────────── */}
        {step === 1 && (
          <section className="v2-section v2-card-connected">
            <p className="v2-section-lead">
              本申請はBioVaultメンバーシップ内で提供するiPSサービス契約の確約ではなく、ご利用検討者様のiPS細胞の作製適合確認、ならびにBioVaultメンバーサイトへのアクセス権を提供するための手続きとなります。
            </p>
            <StepIndicator current={1} />
            <h2 className="v2-section-title">1. 申請者情報</h2>

            <div className="v2-field">
              <label className="v2-label">
                氏名<span className="v2-required-mark">*</span>
              </label>
              <NameInput
                value={form.name}
                onChange={(v) => update("name", v)}
                onKana={(v) => update("nameKana", v)}
              />
              <div className="v2-help">
                ※ 姓と名の間にスペースを入れてください(例: 山田 太郎)
              </div>
            </div>

            <div className="v2-field">
              <label className="v2-label">
                フリガナ(カタカナ)<span className="v2-required-mark">*</span>
              </label>
              <input
                value={form.nameKana}
                onChange={(e) => {
                  // ひらがな→カタカナ自動変換
                  const converted = e.target.value.replace(/[\u3041-\u3096]/g, (ch) =>
                    String.fromCharCode(ch.charCodeAt(0) + 0x60)
                  );
                  update("nameKana", converted);
                }}
                placeholder="ヤマダ タロウ"
                required
                className="v2-input"
              />
              <div className="v2-help">
                ひらがなで入力すると自動でカタカナに変換されます
              </div>
            </div>

            <div className="v2-field">
              <label className="v2-label">
                生年月日<span className="v2-required-mark">*</span>
              </label>
              <DateSelect
                value={form.dateOfBirth}
                onChange={(v) => update("dateOfBirth", v)}
                yearStart={1930}
                yearEnd={2010}
              />
            </div>

            <div className="v2-field">
              <label className="v2-label">郵便番号</label>
              <PostalCodeInput
                value={form.postalCode}
                onChange={(v) => update("postalCode", v)}
                onAddress={(v) => update("address", v)}
              />
            </div>

            <div className="v2-field">
              <label className="v2-label">
                住所<span className="v2-required-mark">*</span>
              </label>
              <input
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="東京都港区..."
                required
                className="v2-input"
              />
            </div>

            <div className="v2-field">
              <label className="v2-label">
                電話番号(ハイフンなし)<span className="v2-required-mark">*</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="09012345678"
                required
                maxLength={11}
                className="v2-input"
                style={{ fontFamily: '"DM Mono", monospace', letterSpacing: "0.05em" }}
              />
            </div>

            <div className="v2-field">
              <label className="v2-label">
                メールアドレス<span className="v2-required-mark">*</span>
              </label>
              <EmailInput value={form.email} onChange={(v) => update("email", v)} />
            </div>

            <div className="v2-field">
              <label className="v2-label">職業</label>
              <select
                value={form.occupation}
                onChange={(e) => update("occupation", e.target.value)}
                className="v2-select"
                style={{ cursor: "pointer" }}
              >
                <option value="">選択してください</option>
                <optgroup label="経営・役員">
                  <option value="会社経営者">会社経営者</option>
                  <option value="会社役員">会社役員</option>
                </optgroup>
                <optgroup label="会社員・団体職員">
                  <option value="会社員(管理職)">会社員(管理職)</option>
                  <option value="会社員(一般)">会社員(一般)</option>
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
            </div>

            <div className="v2-btn-row">
              <V2Button variant="primary" onClick={() => setStep(2)}>
                次へ
              </V2Button>
            </div>
          </section>
        )}

        {/* ──────────────── Step 2: 事前確認事項(健康状態) ──────────────── */}
        {step === 2 && (
          <section className="v2-section v2-card-connected">
            <StepIndicator current={2} />
            <h2 className="v2-section-title">2. 事前確認事項</h2>

            <div className="v2-subhead">健康状態の自己申告</div>
            <div className="v2-subnote">
              <p>
                ※ 以下は、提携医療機関等による問診・適格確認の参考情報として確認するものです。
              </p>
              <p>
                ※ 申請時点での自己申告であり、最終的な導入可否・採血可否・作製可否は提携医療機関または提携先の判断によります。
              </p>
            </div>

            <HealthCheck
              label="(1) 現在治療中の病気"
              checked={form.currentIllness}
              onChange={(v) => update("currentIllness", v)}
              detail={form.currentIllnessDetail}
              onDetail={(v) => update("currentIllnessDetail", v)}
              placeholder="病名・内容"
            />
            <HealthCheck
              label="(2) 過去に大きな病気や手術歴"
              checked={form.pastIllness}
              onChange={(v) => update("pastIllness", v)}
              detail={form.pastIllnessDetail}
              onDetail={(v) => update("pastIllnessDetail", v)}
              placeholder="内容"
            />
            <HealthCheck
              label="(3) 現在使用中の薬"
              checked={form.currentMedication}
              onChange={(v) => update("currentMedication", v)}
              detail={form.currentMedicationDetail}
              onDetail={(v) => update("currentMedicationDetail", v)}
              placeholder="薬名・内容"
            />
            <HealthCheck
              label="(4) 持病の有無"
              checked={form.chronicDisease}
              onChange={(v) => update("chronicDisease", v)}
              detail={form.chronicDiseaseDetail}
              onDetail={(v) => update("chronicDiseaseDetail", v)}
              placeholder="内容"
            />
            <HealthCheck
              label="(5) 感染症の罹患状況・既往"
              checked={form.infectiousDisease}
              onChange={(v) => update("infectiousDisease", v)}
              detail={form.infectiousDiseaseDetail}
              onDetail={(v) => update("infectiousDiseaseDetail", v)}
              placeholder="内容"
            />
            <HealthCheck
              label="(6) 妊娠中または妊娠の可能性"
              checked={form.pregnancy}
              onChange={(v) => update("pregnancy", v)}
            />
            <HealthCheck
              label="(7) アレルギーの有無"
              checked={form.allergy}
              onChange={(v) => update("allergy", v)}
              detail={form.allergyDetail}
              onDetail={(v) => update("allergyDetail", v)}
              placeholder="内容"
            />
            <HealthCheck
              label="(8) その他、健康上の事項"
              checked={form.otherHealth}
              onChange={(v) => update("otherHealth", v)}
              detail={form.otherHealthDetail}
              onDetail={(v) => update("otherHealthDetail", v)}
              placeholder="内容"
            />

            <div className="v2-btn-row">
              <V2Button variant="secondary" onClick={() => setStep(1)}>
                戻る
              </V2Button>
              <V2Button variant="primary" onClick={() => setStep(3)}>
                次へ
              </V2Button>
            </div>
          </section>
        )}

        {/* ──────────────── Step 3: 申請情報取扱いに関する同意 ──────────────── */}
        {step === 3 && (
          <section className="v2-section v2-card-connected">
            <StepIndicator current={3} />
            <h2 className="v2-section-title">3. 申請情報取扱いに関する同意</h2>

            <div className="v2-notice">
              本申請書に記載した内容は、メンバーシップ契約手続き、提携医療機関等による問診・適格確認、細胞作製・保管に関する各種手続きの参考資料として利用されます。
            </div>

            <label className="v2-checkbox-row">
              <input
                type="checkbox"
                checked={form.confirmNotMedical}
                onChange={(e) => update("confirmNotMedical", e.target.checked)}
              />
              <span className="v2-checkbox-label">上記の内容を理解し、承諾します</span>
            </label>

            <div className="v2-btn-row">
              <V2Button variant="secondary" onClick={() => setStep(2)}>
                戻る
              </V2Button>
              <V2Button
                variant="primary"
                onClick={() => setStep(4)}
                disabled={!form.confirmNotMedical}
              >
                次へ
              </V2Button>
            </div>
          </section>
        )}

        {/* ──────────────── Step 4: 入力内容の確認 ──────────────── */}
        {step === 4 && (
          <section className="v2-section v2-card-connected">
            <StepIndicator current={4} />
            <h2 className="v2-section-title">入力内容の確認</h2>

            <div className="v2-confirm-group">
              <div className="v2-confirm-group-title">申請者情報</div>
              <ConfirmRow label="氏名" value={form.name || "---"} />
              <ConfirmRow label="フリガナ" value={form.nameKana || "---"} />
              <ConfirmRow label="生年月日" value={form.dateOfBirth || "---"} />
              <ConfirmRow
                label="住所"
                value={`〒${form.postalCode || "---"} ${form.address || ""}`}
              />
              <ConfirmRow label="電話番号" value={form.phone || "---"} />
              <ConfirmRow label="メール" value={form.email || "---"} />
              <ConfirmRow label="職業" value={form.occupation || "---"} />
            </div>

            <p
              style={{
                fontSize: 14,
                color: "var(--v2-text-secondary)",
                textAlign: "center",
                lineHeight: 1.8,
                margin: "20px 0",
              }}
            >
              上記の内容を真実かつ正確に記載し、
              <br />
              各事項を確認・理解のうえ、
              <br />
              iPS細胞作製の適合確認を申請します。
            </p>

            <div className="v2-btn-row">
              <V2Button variant="secondary" onClick={() => setStep(3)} disabled={submitting}>
                戻る
              </V2Button>
              <V2Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "送信中..." : "申請する"}
              </V2Button>
            </div>
          </section>
        )}
      </div>
    </V2Wrapper>
  );
}

// ──────────────────────────────────────────────
// ステップインジケーター
// ──────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="v2-steps">
      {[1, 2, 3, 4].map((n, i) => (
        <Fragment key={n}>
          <div
            className={`v2-step-dot ${
              current === n ? "is-active" : current > n ? "is-done" : ""
            }`}
          >
            {current > n ? "✓" : n}
          </div>
          {i < 3 && (
            <div className={`v2-step-line ${current > n ? "is-done" : ""}`} />
          )}
        </Fragment>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// 健康状態チェック(なし/あり + 詳細)
// ──────────────────────────────────────────────
function HealthCheck({
  label,
  checked,
  onChange,
  detail,
  onDetail,
  placeholder,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  detail?: string;
  onDetail?: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 15, color: "var(--v2-text-primary)", marginBottom: 8 }}>
        {label}
      </div>
      <div className="v2-radio-group">
        <label className="v2-radio-row">
          <input
            type="radio"
            name={label}
            checked={!checked}
            onChange={() => onChange(false)}
          />
          なし
        </label>
        <label className="v2-radio-row">
          <input
            type="radio"
            name={label}
            checked={checked}
            onChange={() => onChange(true)}
          />
          あり
        </label>
      </div>
      {checked && onDetail && (
        <input
          value={detail || ""}
          onChange={(e) => onDetail(e.target.value)}
          placeholder={placeholder}
          className="v2-input"
          style={{ marginTop: 6 }}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// 確認画面の1行
// ──────────────────────────────────────────────
function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="v2-confirm-row">
      <div className="v2-confirm-label">{label}</div>
      <div className="v2-confirm-value">{value}</div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 年/月/日 プルダウン日付選択
// ──────────────────────────────────────────────
function DateSelect({
  value,
  onChange,
  yearStart = 1930,
  yearEnd = 2030,
}: {
  value: string;
  onChange: (v: string) => void;
  yearStart?: number;
  yearEnd?: number;
}) {
  const parts = value ? value.split("-") : ["", "", ""];
  const year = parts[0] || "";
  const month = parts[1] || "";
  const day = parts[2] || "";

  const updateDate = (y: string, m: string, d: string) => {
    if (y && m && d) {
      onChange(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    } else {
      onChange("");
    }
  };

  const years: number[] = [];
  for (let y = yearStart; y <= yearEnd; y++) years.push(y);

  const daysInMonth =
    year && month ? new Date(Number(year), Number(month), 0).getDate() : 31;

  return (
    <div className="v2-date-row">
      <select
        value={year}
        onChange={(e) => updateDate(e.target.value, month, day)}
        className="v2-select"
      >
        <option value="">年</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>
            {y}年
          </option>
        ))}
      </select>
      <select
        value={month ? String(Number(month)) : ""}
        onChange={(e) => updateDate(year, e.target.value, day)}
        className="v2-select"
      >
        <option value="">月</option>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <option key={m} value={String(m)}>
            {m}月
          </option>
        ))}
      </select>
      <select
        value={day ? String(Number(day)) : ""}
        onChange={(e) => updateDate(year, month, e.target.value)}
        className="v2-select"
      >
        <option value="">日</option>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
          <option key={d} value={String(d)}>
            {d}日
          </option>
        ))}
      </select>
    </div>
  );
}

// ──────────────────────────────────────────────
// 氏名入力(IMEのcompositionイベントでひらがなをカナへ自動抽出)
// ──────────────────────────────────────────────
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
      const hasHiragana = /[\u3041-\u3096]/.test(e.data);
      if (hasHiragana) {
        lastCompositionData.current = toKatakana(e.data);
      }
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
      className="v2-input"
    />
  );
}

function toKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  );
}

// ──────────────────────────────────────────────
// 郵便番号入力(7桁で zipcloud から住所自動取得)
// ──────────────────────────────────────────────
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
    const digits = raw.replace(/[^0-9]/g, "").slice(0, 7);
    let formatted = digits;
    if (digits.length > 3) {
      formatted = digits.slice(0, 3) + "-" + digits.slice(3);
    }
    onChange(formatted);

    if (digits.length === 7) {
      setSearching(true);
      try {
        const res = await fetch(
          `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`
        );
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
    <div style={{ position: "relative" }}>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="000-0000"
        maxLength={8}
        className="v2-input"
        style={{ fontFamily: '"DM Mono", monospace' }}
      />
      {searching && (
        <span
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 12,
            color: "var(--v2-text-muted)",
          }}
        >
          検索中...
        </span>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// メールアドレス入力(500ms debounce で /api/apply/check-email)
// ──────────────────────────────────────────────
function EmailInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
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
      <div style={{ position: "relative" }}>
        <input
          type="email"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="your@email.com"
          required
          className="v2-input"
          style={emailError ? { borderColor: "var(--v2-required)" } : undefined}
        />
        {checking && (
          <span
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 12,
              color: "var(--v2-text-muted)",
            }}
          >
            確認中...
          </span>
        )}
      </div>
      {emailError && (
        <div style={{ fontSize: 12, color: "var(--v2-required)", marginTop: 4 }}>
          {emailError}
        </div>
      )}
    </div>
  );
}
