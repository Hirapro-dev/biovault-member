"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

const ADMIN_TIMELINE = [
  { key: "TERMS_AGREED", label: "iPS細胞作製適合確認", icon: "📋", dbStatus: "TERMS_AGREED" },
  { key: "REGISTERED", label: "ID/パス発行", icon: "🔑", dbStatus: "REGISTERED" },
  { key: "DOC_PRIVACY", label: "重要事項確認／個人情報取扱同意確認", icon: "📜", dbStatus: null },
  { key: "SERVICE_APPLIED", label: "サービス申込", icon: "✍️", dbStatus: "SERVICE_APPLIED" },
  { key: "PAYMENT_CONFIRMED", label: "入金確認", icon: "💰", dbStatus: null },
  { key: "SCHEDULE_ARRANGED", label: "日程調整", icon: "📅", dbStatus: "SCHEDULE_ARRANGED" },
  { key: "DOC_CELL_CONSENT", label: "細胞提供・保管同意", icon: "🧫", dbStatus: null },
  { key: "CLINIC_CONFIRMED", label: "日程確定", icon: "🏥", dbStatus: null },
  { key: "DOC_INFORMED", label: "インフォームドコンセント", icon: "📄", dbStatus: null },
  { key: "BLOOD_COLLECTED", label: "問診・採血", icon: "💉", dbStatus: "BLOOD_COLLECTED" },
  { key: "IPS_CREATING", label: "iPS細胞作製中", icon: "🧬", dbStatus: "IPS_CREATING" },
  { key: "STORAGE_ACTIVE", label: "iPS細胞保管", icon: "🏛️", dbStatus: "STORAGE_ACTIVE" },
] as const;

// カタカナ→ローマ字
const KANA_MAP: Record<string, string> = {"ア":"a","イ":"i","ウ":"u","エ":"e","オ":"o","カ":"ka","キ":"ki","ク":"ku","ケ":"ke","コ":"ko","サ":"sa","シ":"shi","ス":"su","セ":"se","ソ":"so","タ":"ta","チ":"chi","ツ":"tsu","テ":"te","ト":"to","ナ":"na","ニ":"ni","ヌ":"nu","ネ":"ne","ノ":"no","ハ":"ha","ヒ":"hi","フ":"fu","ヘ":"he","ホ":"ho","マ":"ma","ミ":"mi","ム":"mu","メ":"me","モ":"mo","ヤ":"ya","ユ":"yu","ヨ":"yo","ラ":"ra","リ":"ri","ル":"ru","レ":"re","ロ":"ro","ワ":"wa","ヲ":"wo","ン":"n","ガ":"ga","ギ":"gi","グ":"gu","ゲ":"ge","ゴ":"go","ザ":"za","ジ":"ji","ズ":"zu","ゼ":"ze","ゾ":"zo","ダ":"da","ヂ":"di","ヅ":"du","デ":"de","ド":"do","バ":"ba","ビ":"bi","ブ":"bu","ベ":"be","ボ":"bo","パ":"pa","ピ":"pi","プ":"pu","ペ":"pe","ポ":"po","ッ":"tt","ー":""};
function kataToRomaji(kana: string) { let r="",i=0; while(i<kana.length){if(i+1<kana.length&&KANA_MAP[kana.substring(i,i+2)]){r+=KANA_MAP[kana.substring(i,i+2)];i+=2;continue;}if(kana[i]==="ッ"&&i+1<kana.length){const n=KANA_MAP[kana[i+1]];if(n)r+=n[0];i++;continue;}if(KANA_MAP[kana[i]]!==undefined)r+=KANA_MAP[kana[i]];i++;}return r; }
function generatePw() { const c="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";let p="";for(let i=0;i<8;i++)p+=c[Math.floor(Math.random()*c.length)];return p; }

interface Props {
  userId: string;
  currentStatus: string;
  paymentStatus: string;
  signedDocTypes: string[];
  hasAgreedTerms: boolean;
  isIdIssued: boolean;
  currentLoginId: string;
  nameKana: string;
  clinicDate: string | null;
  clinicName: string | null;
  clinicAddress: string | null;
}

export default function AdminStatusTimeline({ userId, currentStatus, paymentStatus, signedDocTypes, hasAgreedTerms, isIdIssued, currentLoginId, nameKana, clinicDate, clinicName, clinicAddress }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());

  // 日程確定ポップアップ
  const [showClinicPopup, setShowClinicPopup] = useState(false);
  const [inputClinicDate, setInputClinicDate] = useState(clinicDate ? clinicDate.split("T")[0] : "");
  const [inputClinicName, setInputClinicName] = useState(clinicName || "");
  const [inputClinicAddress, setInputClinicAddress] = useState(clinicAddress || "");
  const [clinicLoading, setClinicLoading] = useState(false);

  // 日付入力ポップアップ（問診・採血、iPS作製中、iPS保管）
  const [showDatePopup, setShowDatePopup] = useState<string | null>(null);
  const [inputDate, setInputDate] = useState("");
  const [dateLoading, setDateLoading] = useState(false);

  const DATE_POPUP_CONFIG: Record<string, { title: string; label: string; dbStatus: string }> = {
    BLOOD_COLLECTED: { title: "問診・採血", label: "問診・採血日", dbStatus: "BLOOD_COLLECTED" },
    IPS_CREATING: { title: "iPS細胞作製開始", label: "作製開始日", dbStatus: "IPS_CREATING" },
    STORAGE_ACTIVE: { title: "iPS細胞保管開始", label: "保管開始日", dbStatus: "STORAGE_ACTIVE" },
  };

  // ID発行ポップアップ
  const [showIdPopup, setShowIdPopup] = useState(false);
  const [loginId, setLoginId] = useState(currentLoginId || "");
  const [password, setPassword] = useState(() => generatePw());
  const [showPw, setShowPw] = useState(true);
  const [idLoading, setIdLoading] = useState(false);
  const [idMessage, setIdMessage] = useState("");
  const [idError, setIdError] = useState("");

  const DB_ORDER = ["REGISTERED", "TERMS_AGREED", "SERVICE_APPLIED", "SCHEDULE_ARRANGED", "BLOOD_COLLECTED", "IPS_CREATING", "STORAGE_ACTIVE"];
  const currentIdx = DB_ORDER.indexOf(currentStatus);

  const isOriginallyDone = (key: string) => {
    if (key === "REGISTERED") return isIdIssued; // ID/パス発行は実際に発行済みかで判定
    if (key === "DOC_PRIVACY") return signedDocTypes.includes("PRIVACY_POLICY") || hasAgreedTerms;
    if (key === "DOC_CELL_CONSENT") return signedDocTypes.includes("CELL_STORAGE_CONSENT");
    if (key === "CLINIC_CONFIRMED") return !!clinicDate;
    if (key === "DOC_INFORMED") return signedDocTypes.includes("INFORMED_CONSENT");
    if (key === "PAYMENT_CONFIRMED") return paymentStatus === "COMPLETED";
    const idx = DB_ORDER.indexOf(key);
    return idx !== -1 && currentIdx >= idx;
  };

  const isChecked = (key: string) => {
    if (pendingChanges.has(key)) return !isOriginallyDone(key);
    return isOriginallyDone(key);
  };

  const handleToggle = (key: string) => {
    setPendingChanges((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  };

  const generateLoginId = () => {
    const lastName = (nameKana || "").trim().split(/[\s　]+/)[0];
    const base = kataToRomaji(lastName).toLowerCase() || "user";
    return `${base}${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
  };

  const handleUpdate = async () => {
    if (pendingChanges.size === 0 || loading) return;
    setLoading(true);
    try {
      const willCheckTerms = pendingChanges.has("TERMS_AGREED") && !isOriginallyDone("TERMS_AGREED");

      for (const key of pendingChanges) {
        const step = ADMIN_TIMELINE.find((s) => s.key === key);
        if (!step) continue;
        const willBeChecked = !isOriginallyDone(key);

        if (step.dbStatus && willBeChecked) {
          await fetch(`/api/admin/members/${userId}/status`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newStatus: step.dbStatus, note: `管理者がステータスを「${step.label}」に変更` }),
          });
        }
        if (key === "PAYMENT_CONFIRMED" && willBeChecked) {
          await fetch(`/api/admin/members/${userId}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ membership: { paymentStatus: "COMPLETED", paidAmount: 8800000 } }),
          });
        }
      }

      setPendingChanges(new Set());

      // 適合確認チェック & ID未発行 → ID発行ポップアップ
      if (willCheckTerms && !isIdIssued) {
        if (!loginId) setLoginId(generateLoginId());
        setShowIdPopup(true);
      }

      router.refresh();
    } finally { setLoading(false); }
  };

  const handleIssueId = async () => {
    setIdLoading(true); setIdError(""); setIdMessage("");
    try {
      const res = await fetch(`/api/admin/members/${userId}/issue-id`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password }),
      });
      if (res.ok) {
        setIdMessage("ID・パスワードを発行しました");
        setTimeout(() => { setShowIdPopup(false); router.refresh(); }, 1500);
      } else {
        const d = await res.json();
        setIdError(d.error || "エラーが発生しました");
      }
    } catch { setIdError("エラーが発生しました"); }
    finally { setIdLoading(false); }
  };

  const hasPending = pendingChanges.size > 0;

  return (
    <>
      <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
        <div className="space-y-1">
          {ADMIN_TIMELINE.map((step) => {
            const done = isChecked(step.key);
            const originalDone = isOriginallyDone(step.key);
            const adminToggleKeys = ["TERMS_AGREED", "PAYMENT_CONFIRMED", "SCHEDULE_ARRANGED", "CLINIC_CONFIRMED", "BLOOD_COLLECTED", "IPS_CREATING", "STORAGE_ACTIVE"];
            const canToggle = adminToggleKeys.includes(step.key) && !loading;
            const isMemberOnly = !adminToggleKeys.includes(step.key);
            const isPending = pendingChanges.has(step.key);

            const handleClick = () => {
              if (!canToggle) return;
              // 日程確定はポップアップ表示
              if (step.key === "CLINIC_CONFIRMED" && !done) {
                setShowClinicPopup(true);
                return;
              }
              // 日付入力が必要なステップ
              if (DATE_POPUP_CONFIG[step.key] && !done) {
                setInputDate(new Date().toISOString().split("T")[0]);
                setShowDatePopup(step.key);
                return;
              }
              handleToggle(step.key);
            };

            return (
              <div key={step.key} onClick={handleClick} className={`flex items-center gap-3 py-3 px-3 rounded transition-colors ${canToggle ? "cursor-pointer hover:bg-bg-elevated" : ""} ${isPending ? "bg-gold/5" : ""}`}>
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-all ${done ? "bg-gold border-gold" : canToggle ? "border-text-muted/40 hover:border-gold/60" : "border-border"}`}>
                  {done && (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7L6 10L11 4" stroke="#070709" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>)}
                </div>
                <span className={`text-base shrink-0 ${done ? "opacity-100" : "opacity-30"}`}>{step.icon}</span>
                <span className={`text-sm ${done ? "text-gold font-medium" : "text-text-muted"}`}>{step.label}</span>
                {isPending && (<span className="text-[10px] text-gold ml-auto">{done && !originalDone ? "← 変更予定" : originalDone && !done ? "← 解除予定" : ""}</span>)}
                {step.key === "REGISTERED" && !done && !isPending && (<span className="text-[10px] text-text-muted ml-auto">ID発行で自動チェック</span>)}
                {isMemberOnly && step.key !== "REGISTERED" && !done && !isPending && (<span className="text-[10px] text-text-muted ml-auto">会員本人が同意</span>)}
              </div>
            );
          })}
        </div>

        {hasPending && (
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
            <button onClick={() => setPendingChanges(new Set())} className="px-4 py-2 bg-transparent border border-border text-text-secondary rounded-sm text-xs cursor-pointer hover:border-border-gold transition-all">キャンセル</button>
            <button onClick={handleUpdate} disabled={loading} className="flex-1 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer hover:opacity-90 transition-all disabled:opacity-50">
              {loading ? "更新中..." : "ステータスを更新"}
            </button>
          </div>
        )}
      </div>

      {/* ID発行ポップアップ */}
      {showIdPopup && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowIdPopup(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-bg-secondary border border-border-gold rounded-xl p-6 sm:p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif-jp text-base text-gold tracking-wider mb-2">ID・パスワードを発行</h3>
            <p className="text-xs text-text-muted mb-5">iPS適合確認が完了しました。会員にログインIDとパスワードを発行してください。</p>

            {idMessage && <div className="mb-3 p-2 bg-status-active/10 border border-status-active/20 rounded text-status-active text-[11px]">{idMessage}</div>}
            {idError && <div className="mb-3 p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-[11px]">{idError}</div>}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">ログインID</label>
                <div className="flex gap-2">
                  <input inputMode="url" autoCapitalize="none" spellCheck={false} value={loginId} onChange={(e) => setLoginId(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())} className="flex-1 px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none" />
                  <button onClick={() => setLoginId(generateLoginId())} className="px-3 py-2.5 border border-border text-text-muted rounded-sm text-xs hover:text-gold transition-colors cursor-pointer">↻</button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">パスワード</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type={showPw ? "text" : "password"} inputMode="url" autoCapitalize="none" spellCheck={false} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2.5 pr-12 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs cursor-pointer" tabIndex={-1}>{showPw ? "隠す" : "表示"}</button>
                  </div>
                  <button onClick={() => setPassword(generatePw())} className="px-3 py-2.5 border border-border text-text-muted rounded-sm text-xs hover:text-gold transition-colors cursor-pointer">↻</button>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowIdPopup(false)} className="px-4 py-2.5 border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold transition-all">後で</button>
                <button onClick={handleIssueId} disabled={idLoading || !loginId || !password} className="flex-1 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50">
                  {idLoading ? "発行中..." : "発行する"}
                </button>
              </div>
            </div>
          </div>
        </div>, document.body
      )}

      {/* 日程確定ポップアップ */}
      {showClinicPopup && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowClinicPopup(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-bg-secondary border border-border-gold rounded-xl p-6 sm:p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif-jp text-base text-gold tracking-wider mb-2">日程・クリニックを確定</h3>
            <p className="text-xs text-text-muted mb-5">問診・採血の日程と提携クリニックを入力してください。</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1">予定日</label>
                <input type="date" value={inputClinicDate} onChange={(e) => setInputClinicDate(e.target.value)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none" />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">提携クリニック名</label>
                <input value={inputClinicName} onChange={(e) => setInputClinicName(e.target.value)} placeholder="例: ○○クリニック 東京院" className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">住所</label>
                <input value={inputClinicAddress} onChange={(e) => setInputClinicAddress(e.target.value)} placeholder="例: 東京都港区..." className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowClinicPopup(false)} className="px-4 py-2.5 border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold transition-all">キャンセル</button>
                <button
                  onClick={async () => {
                    if (!inputClinicDate) return;
                    setClinicLoading(true);
                    try {
                      await fetch(`/api/admin/members/${userId}`, {
                        method: "PATCH", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ membership: { clinicDate: new Date(inputClinicDate).toISOString(), clinicName: inputClinicName || null, clinicAddress: inputClinicAddress || null } }),
                      });
                      setShowClinicPopup(false);
                      router.refresh();
                    } finally { setClinicLoading(false); }
                  }}
                  disabled={clinicLoading || !inputClinicDate}
                  className="flex-1 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {clinicLoading ? "保存中..." : "確定する"}
                </button>
              </div>
            </div>
          </div>
        </div>, document.body
      )}

      {/* 日付入力ポップアップ（問診・採血 / iPS作製中 / iPS保管） */}
      {showDatePopup && DATE_POPUP_CONFIG[showDatePopup] && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowDatePopup(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-bg-secondary border border-border-gold rounded-xl p-6 sm:p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif-jp text-base text-gold tracking-wider mb-2">{DATE_POPUP_CONFIG[showDatePopup].title}</h3>
            <p className="text-xs text-text-muted mb-5">日付を入力してステータスを更新します。</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1">{DATE_POPUP_CONFIG[showDatePopup].label}</label>
                <input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowDatePopup(null)} className="px-4 py-2.5 border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold transition-all">キャンセル</button>
                <button
                  onClick={async () => {
                    if (!inputDate) return;
                    setDateLoading(true);
                    try {
                      await fetch(`/api/admin/members/${userId}/status`, {
                        method: "PATCH", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          newStatus: DATE_POPUP_CONFIG[showDatePopup!].dbStatus,
                          note: `管理者がステータスを「${DATE_POPUP_CONFIG[showDatePopup!].title}」に変更（${inputDate}）`,
                          date: new Date(inputDate).toISOString(),
                        }),
                      });
                      setShowDatePopup(null);
                      router.refresh();
                    } finally { setDateLoading(false); }
                  }}
                  disabled={dateLoading || !inputDate}
                  className="flex-1 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {dateLoading ? "更新中..." : "確定する"}
                </button>
              </div>
            </div>
          </div>
        </div>, document.body
      )}
    </>
  );
}
