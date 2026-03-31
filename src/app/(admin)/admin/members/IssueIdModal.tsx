"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

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

export default function IssueIdModal({
  userId,
  loginId: currentLoginId,
  nameKana,
  isIdIssued,
}: {
  userId: string;
  loginId: string;
  nameKana: string;
  isIdIssued: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loginId, setLoginId] = useState(currentLoginId);
  const [password, setPassword] = useState(() => generatePw());
  const [showPw, setShowPw] = useState(true);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const generateLoginId = useCallback(() => {
    const lastName = (nameKana || "").trim().split(/[\s　]+/)[0];
    const base = kataToRomaji(lastName).toLowerCase() || "user";
    const num = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    return `${base}${num}`;
  }, [nameKana]);

  const handleOpen = () => {
    if (!loginId || loginId === currentLoginId) {
      setLoginId(generateLoginId());
    }
    setPassword(generatePw());
    setDone(false);
    setError("");
    setOpen(true);
  };

  const handleIssue = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/members/${userId}/issue-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password }),
      });
      if (res.ok) {
        setDone(true);
        router.refresh();
      } else {
        const d = await res.json();
        setError(d.error || "エラーが発生しました");
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // 発行済み表示
  if (isIdIssued && !done) {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-active/10 text-status-active border border-status-active/20">
        ID発行済
      </span>
    );
  }

  return (
    <>
      {/* トリガーボタン */}
      {!isIdIssued && !done && (
        <button
          onClick={handleOpen}
          className="px-2.5 py-1 bg-gold/10 border border-gold/20 text-gold rounded-sm text-[11px] hover:bg-gold/20 transition-all cursor-pointer"
        >
          ID発行
        </button>
      )}

      {/* 発行完了後の表示 */}
      {done && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-active/10 text-status-active border border-status-active/20">
          ID発行済
        </span>
      )}

      {/* モーダル */}
      {open && (
        <>
          {/* オーバーレイ */}
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => !loading && setOpen(false)} />

          {/* モーダル本体 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {!done ? (
                <>
                  <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-5 pb-3 border-b border-border">
                    アカウント情報
                  </h3>

                  {error && (
                    <div className="mb-3 p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-[11px]">
                      {error}
                    </div>
                  )}

                  {/* ログインID */}
                  <div className="mb-4">
                    <label className="block text-xs text-text-secondary mb-1.5">ログインID</label>
                    <div className="flex gap-2">
                      <input
                        inputMode="url"
                        autoCapitalize="none"
                        spellCheck={false}
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())}
                        className="flex-1 px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none focus:border-border-gold"
                      />
                      <button
                        onClick={() => setLoginId(generateLoginId())}
                        className="px-3 py-3 border border-border text-text-muted rounded-sm text-xs hover:text-gold transition-colors cursor-pointer"
                      >
                        ↻
                      </button>
                    </div>
                  </div>

                  {/* パスワード */}
                  <div className="mb-6">
                    <label className="block text-xs text-text-secondary mb-1.5">パスワード</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showPw ? "text" : "password"}
                          inputMode="url"
                          autoCapitalize="none"
                          spellCheck={false}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-14 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none focus:border-border-gold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs cursor-pointer"
                          tabIndex={-1}
                        >
                          {showPw ? "隠す" : "表示"}
                        </button>
                      </div>
                      <button
                        onClick={() => setPassword(generatePw())}
                        className="px-3 py-3 border border-border text-text-muted rounded-sm text-xs hover:text-gold transition-colors cursor-pointer"
                      >
                        ↻
                      </button>
                    </div>
                  </div>

                  {/* ボタン */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleIssue}
                      disabled={loading || !loginId || !password}
                      className="flex-1 py-3 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50 hover:opacity-90 transition-all"
                    >
                      {loading ? "発行中..." : "発行する"}
                    </button>
                    <button
                      onClick={() => setOpen(false)}
                      disabled={loading}
                      className="px-5 py-3 border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold transition-all"
                    >
                      取消
                    </button>
                  </div>
                </>
              ) : (
                /* 発行完了 */
                <div className="text-center py-4">
                  <div className="text-3xl mb-3">✓</div>
                  <h3 className="text-base text-gold mb-4">ID を発行しました</h3>
                  <div className="bg-bg-elevated rounded-md p-4 mb-3 text-left">
                    <div className="text-[11px] text-text-muted mb-1">ログインID</div>
                    <div className="font-mono text-sm text-gold tracking-wider">{loginId}</div>
                  </div>
                  <div className="bg-bg-elevated rounded-md p-4 mb-4 text-left">
                    <div className="text-[11px] text-text-muted mb-1">パスワード</div>
                    <div className="font-mono text-sm text-gold tracking-wider">{password}</div>
                  </div>
                  <p className="text-[11px] text-text-muted mb-4">上記の情報を会員様へお伝えください</p>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-full py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer"
                  >
                    閉じる
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
