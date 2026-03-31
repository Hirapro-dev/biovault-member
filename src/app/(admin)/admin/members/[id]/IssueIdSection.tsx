"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const KANA_MAP: Record<string, string> = {
  "ア":"a","イ":"i","ウ":"u","エ":"e","オ":"o","カ":"ka","キ":"ki","ク":"ku","ケ":"ke","コ":"ko",
  "サ":"sa","シ":"shi","ス":"su","セ":"se","ソ":"so","タ":"ta","チ":"chi","ツ":"tsu","テ":"te","ト":"to",
  "ナ":"na","ニ":"ni","ヌ":"nu","ネ":"ne","ノ":"no","ハ":"ha","ヒ":"hi","フ":"fu","ヘ":"he","ホ":"ho",
  "マ":"ma","ミ":"mi","ム":"mu","メ":"me","モ":"mo","ヤ":"ya","ユ":"yu","ヨ":"yo",
  "ラ":"ra","リ":"ri","ル":"ru","レ":"re","ロ":"ro","ワ":"wa","ヲ":"wo","ン":"n",
  "ガ":"ga","ギ":"gi","グ":"gu","ゲ":"ge","ゴ":"go","ザ":"za","ジ":"ji","ズ":"zu","ゼ":"ze","ゾ":"zo",
  "ダ":"da","ヂ":"di","ヅ":"du","デ":"de","ド":"do","バ":"ba","ビ":"bi","ブ":"bu","ベ":"be","ボ":"bo",
  "パ":"pa","ピ":"pi","プ":"pu","ペ":"pe","ポ":"po","ッ":"tt","ー":"",
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
function generatePw() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let p = "";
  for (let i = 0; i < 8; i++) p += c[Math.floor(Math.random() * c.length)];
  return p;
}

export default function IssueIdSection({
  userId,
  currentLoginId,
  nameKana,
  isIdIssued,
}: {
  userId: string;
  currentLoginId: string;
  nameKana: string;
  isIdIssued: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldOpen = searchParams.get("issueId") === "1";

  const [open, setOpen] = useState(shouldOpen && !isIdIssued);
  const [loginId, setLoginId] = useState(currentLoginId);
  const [password, setPassword] = useState(() => generatePw());
  const [showPw, setShowPw] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // PW変更用
  const [showPwChange, setShowPwChange] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  const generateLoginId = useCallback(() => {
    const lastName = (nameKana || "").trim().split(/[\s　]+/)[0];
    const base = kataToRomaji(lastName).toLowerCase() || "user";
    const num = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    return `${base}${num}`;
  }, [nameKana]);

  useEffect(() => {
    if (open && !loginId) {
      setLoginId(generateLoginId());
    }
  }, [open, loginId, generateLoginId]);

  const handleIssue = async () => {
    setLoading(true); setError(""); setMessage("");
    try {
      const res = await fetch(`/api/admin/members/${userId}/issue-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password }),
      });
      if (res.ok) {
        setMessage("ID を発行しました");
        setOpen(false);
        router.refresh();
      } else {
        const d = await res.json();
        setError(d.error || "エラーが発生しました");
      }
    } catch { setError("エラーが発生しました"); }
    finally { setLoading(false); }
  };

  const handlePwChange = async () => {
    setPwLoading(true); setPwMsg("");
    try {
      const res = await fetch(`/api/admin/members/${userId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newPw }),
      });
      if (res.ok) {
        setPwMsg("パスワードを変更しました");
        setNewPw("");
        setShowPwChange(false);
      } else {
        const d = await res.json();
        setPwMsg(d.error || "エラー");
      }
    } catch { setPwMsg("エラーが発生しました"); }
    finally { setPwLoading(false); }
  };

  return (
    <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6 mb-5">
      <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
        アカウント情報
      </h3>

      {message && <div className="mb-3 p-2 bg-status-active/10 border border-status-active/20 rounded text-status-active text-[11px]">{message}</div>}
      {error && <div className="mb-3 p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-[11px]">{error}</div>}
      {pwMsg && <div className="mb-3 p-2 bg-status-active/10 border border-status-active/20 rounded text-status-active text-[11px]">{pwMsg}</div>}

      {isIdIssued ? (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-active/10 text-status-active border border-status-active/20">ID発行済</span>
            <span className="font-mono text-sm text-gold">{currentLoginId}</span>
          </div>

          {/* PW変更 */}
          {!showPwChange ? (
            <button onClick={() => setShowPwChange(true)} className="text-xs text-text-muted hover:text-gold transition-colors cursor-pointer">
              パスワードを変更 →
            </button>
          ) : (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                inputMode="url"
                autoCapitalize="none"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="新しいパスワード（8文字以上）"
                className="flex-1 px-3 py-2 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none"
              />
              <button onClick={handlePwChange} disabled={pwLoading || newPw.length < 8} className="px-3 py-2 bg-gold-gradient text-bg-primary text-[11px] font-semibold rounded-sm cursor-pointer disabled:opacity-50">
                {pwLoading ? "..." : "変更"}
              </button>
              <button onClick={() => { setShowPwChange(false); setNewPw(""); }} className="px-2 py-2 text-text-muted text-[11px] cursor-pointer">取消</button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-warning/10 text-status-warning border border-status-warning/20">未発行</span>
            <span className="text-xs text-text-muted">ログインIDとパスワードを発行してください</span>
          </div>

          {!open ? (
            <button onClick={() => setOpen(true)} className="w-full py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer">
              ID・パスワードを発行
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">ログインID</label>
                <div className="flex gap-2">
                  <input
                    inputMode="url" autoCapitalize="none" spellCheck={false}
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())}
                    className="flex-1 px-3 py-2 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none"
                  />
                  <button onClick={() => setLoginId(generateLoginId())} className="px-2 py-2 border border-border text-text-muted rounded-sm text-xs hover:text-gold transition-colors cursor-pointer">↻</button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">パスワード</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPw ? "text" : "password"}
                      inputMode="url" autoCapitalize="none" spellCheck={false}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-12 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs cursor-pointer" tabIndex={-1}>
                      {showPw ? "隠す" : "表示"}
                    </button>
                  </div>
                  <button onClick={() => setPassword(generatePw())} className="px-2 py-2 border border-border text-text-muted rounded-sm text-xs hover:text-gold transition-colors cursor-pointer">↻</button>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleIssue} disabled={loading || !loginId || !password} className="flex-1 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50">
                  {loading ? "発行中..." : "発行する"}
                </button>
                <button onClick={() => setOpen(false)} className="px-4 py-2.5 border border-border text-text-secondary rounded-sm text-sm cursor-pointer">取消</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
