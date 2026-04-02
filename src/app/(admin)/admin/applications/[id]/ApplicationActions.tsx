"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// カタカナ→ローマ字変換
const KANA_MAP: Record<string, string> = {
  "ア":"a","イ":"i","ウ":"u","エ":"e","オ":"o","カ":"ka","キ":"ki","ク":"ku","ケ":"ke","コ":"ko",
  "サ":"sa","シ":"shi","ス":"su","セ":"se","ソ":"so","タ":"ta","チ":"chi","ツ":"tsu","テ":"te","ト":"to",
  "ナ":"na","ニ":"ni","ヌ":"nu","ネ":"ne","ノ":"no","ハ":"ha","ヒ":"hi","フ":"fu","ヘ":"he","ホ":"ho",
  "マ":"ma","ミ":"mi","ム":"mu","メ":"me","モ":"mo","ヤ":"ya","ユ":"yu","ヨ":"yo",
  "ラ":"ra","リ":"ri","ル":"ru","レ":"re","ロ":"ro","ワ":"wa","ヲ":"wo","ン":"n",
  "ガ":"ga","ギ":"gi","グ":"gu","ゲ":"ge","ゴ":"go","ザ":"za","ジ":"ji","ズ":"zu","ゼ":"ze","ゾ":"zo",
  "ダ":"da","ヂ":"di","ヅ":"du","デ":"de","ド":"do","バ":"ba","ビ":"bi","ブ":"bu","ベ":"be","ボ":"bo",
  "パ":"pa","ピ":"pi","プ":"pu","ペ":"pe","ポ":"po",
  "キャ":"kya","キュ":"kyu","キョ":"kyo","シャ":"sha","シュ":"shu","ショ":"sho",
  "チャ":"cha","チュ":"chu","チョ":"cho","ニャ":"nya","ニュ":"nyu","ニョ":"nyo",
  "ヒャ":"hya","ヒュ":"hyu","ヒョ":"hyo","ミャ":"mya","ミュ":"myu","ミョ":"myo",
  "リャ":"rya","リュ":"ryu","リョ":"ryo","ギャ":"gya","ギュ":"gyu","ギョ":"gyo",
  "ジャ":"ja","ジュ":"ju","ジョ":"jo","ッ":"tt","ー":"",
};
function kataToRomaji(kana: string) {
  let r = "", i = 0;
  while (i < kana.length) {
    if (i+1 < kana.length && KANA_MAP[kana.substring(i,i+2)]) { r += KANA_MAP[kana.substring(i,i+2)]; i += 2; continue; }
    if (kana[i]==="ッ" && i+1 < kana.length) { const n=KANA_MAP[kana[i+1]]; if(n) r+=n[0]; i++; continue; }
    if (KANA_MAP[kana[i]] !== undefined) r += KANA_MAP[kana[i]];
    i++;
  }
  return r;
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "申込受付" },
  { value: "REVIEWING", label: "iPS細胞作製適合確認中" },
  { value: "APPROVED", label: "承認済" },
  { value: "REJECTED", label: "却下" },
];

function generatePassword() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let p = "";
  for (let i = 0; i < 8; i++) p += c[Math.floor(Math.random() * c.length)];
  return p;
}

export default function ApplicationActions({
  applicationId, status, nameKana, convertedUserId, adminNote,
}: {
  applicationId: string; status: string; nameKana: string; convertedUserId: string | null; adminNote: string | null;
}) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [note, setNote] = useState(adminNote || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 会員登録フォーム
  const [showRegister, setShowRegister] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState(() => generatePassword());
  const [nameRomaji, setNameRomaji] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerResult, setRegisterResult] = useState<{ loginId: string; password: string; memberNumber: string } | null>(null);

  const generateLoginId = useCallback(() => {
    const parts = nameKana.trim().split(/[\s　]+/);
    const romaji = kataToRomaji(parts[0]).toLowerCase();
    const num = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    return romaji ? `${romaji}${num}` : "";
  }, [nameKana]);

  const generateRomajiName = useCallback(() => {
    const parts = nameKana.trim().split(/[\s　]+/);
    if (parts.length >= 2) {
      const last = kataToRomaji(parts[0]).toUpperCase();
      const first = kataToRomaji(parts[1]);
      if (last && first) return `${first.charAt(0).toUpperCase()}${first.slice(1)} ${last}`;
    }
    return "";
  }, [nameKana]);

  useEffect(() => {
    if (showRegister && !loginId) {
      setLoginId(generateLoginId());
      setNameRomaji(generateRomajiName());
    }
  }, [showRegister, loginId, generateLoginId, generateRomajiName]);

  const handleStatusUpdate = async () => {
    setSaving(true); setMessage(""); setError("");
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: currentStatus, adminNote: note }),
      });
      if (res.ok) { setMessage("更新しました"); router.refresh(); }
      else { const d = await res.json(); setError(d.error); }
    } catch { setError("エラーが発生しました"); }
    finally { setSaving(false); }
  };

  const handleRegister = async () => {
    setRegistering(true); setError("");
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password, nameRomaji }),
      });
      if (res.ok) {
        const data = await res.json();
        setRegisterResult({ loginId: data.loginId, password: data.password, memberNumber: data.memberNumber });
        router.refresh();
      } else { const d = await res.json(); setError(d.error); }
    } catch { setError("エラーが発生しました"); }
    finally { setRegistering(false); }
  };

  // 既に会員登録済み
  if (status === "REGISTERED" && convertedUserId) {
    return (
      <div className="bg-bg-secondary border border-status-active/20 rounded-md p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-status-active">✓</span>
          <span className="text-sm text-status-active font-medium">会員登録済み</span>
        </div>
        <Link
          href={`/admin/members/${convertedUserId}`}
          className="text-xs text-gold hover:text-gold-light transition-colors"
        >
          会員カルテを見る →
        </Link>
      </div>
    );
  }

  // 会員登録完了表示
  if (registerResult) {
    return (
      <div className="bg-bg-secondary border border-border-gold rounded-md p-6 text-center">
        <div className="text-3xl mb-3">✓</div>
        <h3 className="text-base text-gold mb-4">会員登録が完了しました</h3>
        <div className="bg-bg-elevated rounded-md p-4 mb-3 text-left">
          <div className="text-[11px] text-text-muted mb-1">会員番号</div>
          <div className="font-mono text-sm text-gold">{registerResult.memberNumber}</div>
        </div>
        <div className="bg-bg-elevated rounded-md p-4 mb-3 text-left">
          <div className="text-[11px] text-text-muted mb-1">ログインID</div>
          <div className="font-mono text-sm text-gold">{registerResult.loginId}</div>
        </div>
        <div className="bg-bg-elevated rounded-md p-4 mb-4 text-left">
          <div className="text-[11px] text-text-muted mb-1">パスワード</div>
          <div className="font-mono text-sm text-gold">{registerResult.password}</div>
        </div>
        <p className="text-[11px] text-text-muted mb-4">上記の情報を会員様へお伝えください</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
      {/* ステータス変更 */}
      <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
        <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">ステータス変更</h3>
        {message && <div className="mb-3 p-2 bg-status-active/10 border border-status-active/20 rounded text-status-active text-[11px]">{message}</div>}
        {error && <div className="mb-3 p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-[11px]">{error}</div>}

        <select value={currentStatus} onChange={(e) => setCurrentStatus(e.target.value)} className="w-full px-4 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none mb-3 cursor-pointer">
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="管理者メモ" rows={3} className="w-full px-4 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none resize-none mb-3" />
        <button onClick={handleStatusUpdate} disabled={saving} className="w-full py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50">
          {saving ? "更新中..." : "更新"}
        </button>
      </div>

      {/* 会員登録 */}
      <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
        <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">会員登録</h3>

        {!showRegister ? (
          <div>
            <p className="text-xs text-text-secondary mb-4">この申込を元に会員アカウントを作成します。ログインIDとパスワードが自動生成されます。</p>
            <button onClick={() => setShowRegister(true)} className="w-full py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer">
              会員登録を開始
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <label className="block text-xs text-text-secondary mb-1">ログインID</label>
              <div className="flex gap-2">
                <input value={loginId} onChange={(e) => setLoginId(e.target.value.replace(/[^a-zA-Z0-9]/g,"").toLowerCase())} inputMode="url" autoCapitalize="none" className="flex-1 px-3 py-2 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none" />
                <button onClick={() => setLoginId(generateLoginId())} className="px-2 py-2 border border-border text-text-muted rounded-sm text-xs hover:text-gold transition-colors cursor-pointer">↻</button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-text-secondary mb-1">パスワード</label>
              <div className="flex gap-2">
                <input value={password} onChange={(e) => setPassword(e.target.value)} className="flex-1 px-3 py-2 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none" />
                <button onClick={() => setPassword(generatePassword())} className="px-2 py-2 border border-border text-text-muted rounded-sm text-xs hover:text-gold transition-colors cursor-pointer">↻</button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-text-secondary mb-1">ローマ字氏名</label>
              <input value={nameRomaji} onChange={(e) => setNameRomaji(e.target.value)} placeholder="Taro YAMADA" className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none" />
            </div>
            <button onClick={handleRegister} disabled={registering || !loginId || !password} className="w-full py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50">
              {registering ? "登録中..." : "会員登録を実行"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
