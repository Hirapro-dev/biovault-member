"use client";

/**
 * 適合確認フォーム（リード専用URL版）
 *
 * LP登録済みの情報（メール・住所・職業）は再取得しない。
 * 本人確認（氏名・電話番号）＋ 会員登録に必要な追加項目（フリガナ・生年月日）
 * ＋ 健康状態の自己申告 ＋ 同意 を取得し、/api/form/ips-check/[token] に送信する。
 * デザインは既存の申請フォーム(/form/app)の v2 スタイルを踏襲。
 */

import { useState, Fragment } from "react";
import V2Wrapper from "@/components/form-v2/V2Wrapper";
import V2Button from "@/components/form-v2/V2Button";

export default function IpsCheckForm({
  token,
  leadName,
  leadPhone,
}: {
  token: string;
  leadName: string;
  leadPhone: string;
}) {
  const [step, setStepRaw] = useState(1);
  const setStep = (s: number) => {
    setStepRaw(s);
    setTimeout(() => window.scrollTo(0, 0), 50);
  };
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: leadName,
    nameKana: "",
    dateOfBirth: "1980-01-01",
    phone: leadPhone,
    // 健康状態
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
    // 同意
    confirmNotMedical: false,
  });

  const update = (field: string, value: unknown) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/form/ips-check/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
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
      <V2Wrapper
        scheme="MRT"
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
        <div className="v2-form-container" style={{ paddingTop: 40, paddingBottom: 56 }}>
          <section className="v2-section" style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "var(--v2-text-secondary)", lineHeight: 1.9 }}>
              ご申請ありがとうございます。
              <br />
              ご入力いただいた内容をもとに適合確認を行い、
              <br />
              結果を担当者よりご連絡いたします。
              <br />
              今しばらくお待ちください。
            </p>
          </section>
        </div>
      </V2Wrapper>
    );
  }

  return (
    <V2Wrapper
      scheme="MRT"
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

        {/* ──────────────── Step 1: 申請者情報の確認 ──────────────── */}
        {step === 1 && (
          <section className="v2-section v2-card-connected">
            <p className="v2-section-lead">
              本申請はBioVaultメンバーシップ内で提供するiPSサービス契約の確約ではなく、ご利用検討者様のiPS細胞の作製適合確認、ならびにBioVaultメンバーサイトへのアクセス権を提供するための手続きとなります。
            </p>
            <StepIndicator current={1} />
            <h2 className="v2-section-title">1. 申請者情報の確認</h2>
            <div className="v2-subnote">
              <p>※ お申込み時にご入力いただいたメールアドレス・ご住所は登録済みのため、再入力は不要です。</p>
            </div>

            <div className="v2-field">
              <label className="v2-label">
                氏名<span className="v2-required-mark">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="山田 太郎"
                required
                className="v2-input"
              />
              <div className="v2-help">※ 姓と名の間にスペースを入れてください(例: 山田 太郎)</div>
            </div>

            <div className="v2-field">
              <label className="v2-label">
                フリガナ(カタカナ)<span className="v2-required-mark">*</span>
              </label>
              <input
                value={form.nameKana}
                onChange={(e) => {
                  const converted = e.target.value.replace(/[ぁ-ゖ]/g, (ch) =>
                    String.fromCharCode(ch.charCodeAt(0) + 0x60)
                  );
                  update("nameKana", converted);
                }}
                placeholder="ヤマダ タロウ"
                required
                className="v2-input"
              />
              <div className="v2-help">ひらがなで入力すると自動でカタカナに変換されます</div>
            </div>

            <div className="v2-field">
              <label className="v2-label">
                生年月日<span className="v2-required-mark">*</span>
              </label>
              <DateSelect value={form.dateOfBirth} onChange={(v) => update("dateOfBirth", v)} />
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

            <div className="v2-btn-row">
              <V2Button
                variant="primary"
                onClick={() => setStep(2)}
                disabled={!form.name.trim() || !form.nameKana.trim() || form.phone.length < 10}
              >
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
              <p>※ 以下は、提携医療機関等による問診・適格確認の参考情報として確認するものです。</p>
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
              <V2Button variant="primary" onClick={() => setStep(4)} disabled={!form.confirmNotMedical}>
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
              <ConfirmRow label="電話番号" value={form.phone || "---"} />
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

// ステップインジケーター（/form/app と同型）
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="v2-steps">
      {[1, 2, 3, 4].map((n, i) => (
        <Fragment key={n}>
          <div className={`v2-step-dot ${current === n ? "is-active" : current > n ? "is-done" : ""}`}>
            {current > n ? "✓" : n}
          </div>
          {i < 3 && <div className={`v2-step-line ${current > n ? "is-done" : ""}`} />}
        </Fragment>
      ))}
    </div>
  );
}

// 健康状態チェック（なし/あり + 詳細）
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
      <div style={{ fontSize: 15, color: "var(--v2-text-primary)", marginBottom: 8 }}>{label}</div>
      <div className="v2-radio-group">
        <label className="v2-radio-row">
          <input type="radio" name={label} checked={!checked} onChange={() => onChange(false)} />
          なし
        </label>
        <label className="v2-radio-row">
          <input type="radio" name={label} checked={checked} onChange={() => onChange(true)} />
          あり
        </label>
      </div>
      {checked && onDetail && (
        <input
          value={detail || ""}
          onChange={(e) => onDetail(e.target.value)}
          placeholder={placeholder}
          className="v2-input"
          style={{ marginTop: 8 }}
        />
      )}
    </div>
  );
}

// 生年月日セレクト（年/月/日）
function DateSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [y, m, d] = value.split("-").map((v) => parseInt(v, 10));
  const years: number[] = [];
  for (let yy = 2010; yy >= 1930; yy--) years.push(yy);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const emit = (ny: number, nm: number, nd: number) =>
    onChange(`${ny}-${String(nm).padStart(2, "0")}-${String(nd).padStart(2, "0")}`);
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <select className="v2-select" value={y} onChange={(e) => emit(parseInt(e.target.value), m, d)}>
        {years.map((yy) => (
          <option key={yy} value={yy}>{yy}年</option>
        ))}
      </select>
      <select className="v2-select" value={m} onChange={(e) => emit(y, parseInt(e.target.value), d)}>
        {months.map((mm) => (
          <option key={mm} value={mm}>{mm}月</option>
        ))}
      </select>
      <select className="v2-select" value={d} onChange={(e) => emit(y, m, parseInt(e.target.value))}>
        {days.map((dd) => (
          <option key={dd} value={dd}>{dd}日</option>
        ))}
      </select>
    </div>
  );
}

// 確認行
function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="v2-confirm-row">
      <div className="v2-confirm-label">{label}</div>
      <div className="v2-confirm-value">{value}</div>
    </div>
  );
}
