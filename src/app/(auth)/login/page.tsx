"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-primary" />}>
      <LoginPage />
    </Suspense>
  );
}

function LoginPage() {
  const searchParams = useSearchParams();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // テスター用：クエリパラメータからログインID・パスワードを自動入力
  useEffect(() => {
    const tid = searchParams.get("tid");
    const tpw = searchParams.get("tpw");
    if (tid) setLoginId(tid);
    if (tpw) {
      setPassword(tpw);
      setShowPassword(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      loginId,
      password,
      rememberMe: "true",
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("ログインIDまたはパスワードが正しくありません");
      return;
    }

    // セッションからロールを取得してリダイレクト先を分岐
    // フルリロードによる遷移にして、ミドルウェアと layout の再評価を確実に行う
    // （router.push だとサーバーコンポーネント側のレンダリングが未完了のまま
    //   遷移できず、メニューを開くまで真っ白に見える現象を回避する）
    const session = await getSession();
    const role = (session?.user as any)?.role;

    let target = "/mypage";
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      target = "/admin";
    } else if (role === "AGENCY") {
      target = "/agency";
    } else if (role === "STAFF") {
      target = "/staff";
    }
    window.location.href = target;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0c47a0]">
      {/* 背景: ブランドのパープル→シアン グラデーション + 動画(うっすらDNA) */}
      <div
        className="absolute inset-0 z-0"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(125deg, #5800FF 0%, #2f44d4 45%, #2f8fd8 72%, #5CE1E6 100%)",
        }}
      />
      <video
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-30 mix-blend-screen"
        src="/header-bg.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />

      {/* コンテンツ: 最大1120pxのラッパー(コピー+カード=左 / 人物=ラッパー右端) */}
      <div className="relative z-20 px-6">
        <div className="relative w-full max-w-[1120px] mx-auto min-h-screen">
          {/* 人物(lg以上・ラッパー右端に配置)
              ▼サイズ調整: 高さ h-[86vh] / 横幅上限 max-w-[48%] を変更 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/nagashima_login.png"
            alt=""
            aria-hidden="true"
            className="hidden lg:block absolute bottom-0 right-0 h-[86vh] w-auto max-w-[48%] object-contain object-bottom z-10 pointer-events-none select-none"
          />
          {/* 人物(SP: 右上に配置・背景レイヤー / フォームは前面・ファーストビュー内)
              ▼サイズ調整: 高さ h-[46vh] / 位置 top-[14%] right-[-6%] を変更 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/nagashima_login.png"
            alt=""
            aria-hidden="true"
            className="lg:hidden absolute top-[2%] right-[-4%] w-[50%] max-w-[230px] h-auto object-contain object-top z-0 opacity-95 pointer-events-none select-none"
          />
          {/* ロゴ(上 / SPは小さめ) */}
          <div
            className="absolute top-6 lg:top-8 left-0 z-20"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            <div
              className="text-white font-medium leading-none text-[22px] lg:text-[34px]"
              style={{ letterSpacing: "0.04em" }}
            >
              BioVault
            </div>
            <div
              className="text-white mt-1 lg:mt-1.5 text-[10px] lg:text-[14px]"
              style={{ letterSpacing: "0.18em" }}
            >
              Membership Service
            </div>
          </div>

          {/* メインコピー + カード(SPはロゴ下から / PCは上下中央) */}
          <div className="relative z-20 min-h-screen flex items-start lg:items-center justify-center lg:justify-start pt-[80px] lg:pt-0 pb-12 lg:pb-0">
            <div className="w-full max-w-[500px] animate-fade-in">
              {/* メインコピー(SPは幅を制限して折返し&人物と干渉回避 / 影で可読性確保) */}
              <div
                className="mb-6 lg:mb-10 text-left max-w-[290px] sm:max-w-[440px] lg:max-w-none"
                style={{ textShadow: "0 2px 14px rgba(0,0,0,0.45)" }}
              >
                <h1
                  className="text-white font-bold leading-[1.35] whitespace-nowrap text-[24px] lg:text-[48px]"
                  style={{
                    fontFamily: "var(--font-serif-jp)",
                    letterSpacing: "0.03em",
                  }}
                >
                  あなた自身の細胞を
                  <br />
                  資産化する時代。
                </h1>
                <p className="text-white/90 mt-2 leading-[1.9] text-[14px] lg:text-[16px]">
                  自分由来のiPS細胞を作製し
                  <br className="lg:hidden" />
                  「細胞資産」として保有する、
                  <br />
                  次世代ウェルネスサービス。
                </p>
              </div>
              {/* カード */}
              <div className="w-full max-w-[440px] mx-auto lg:mx-0">
                {/* フォーム */}
        <form
          onSubmit={handleSubmit}
          className="bg-bg-secondary border border-border-gold rounded px-6 py-8 sm:px-5 sm:py-10"
        >
          {/* アカウント追加モード時のヒント表示（前のアカウントは保存済み・ログイン後はメニューから切替可能） */}
          {searchParams.get("addAccount") === "1" && (
            <div className="mb-4 p-3 bg-gold/5 border border-gold/30 rounded text-gold text-xs text-center">
              別のアカウントでログインしてください。<br />
              ログイン後、メニューから保存済みアカウントとパスワード入力なしで切り替えられます。
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-xs text-center">
              {error}
            </div>
          )}

          <label className="block text-[11px] text-text-secondary tracking-[2px] mb-2 uppercase">
            Login ID
          </label>
          <input
            type="text"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            spellCheck={false}
            value={loginId}
            onChange={(e) => setLoginId(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())}
            placeholder="tanaka0001"
            required
            className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold mb-5 font-mono tracking-wider"
          />

          <label className="block text-[11px] text-text-secondary tracking-[2px] mb-2 uppercase">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="current-password"
              spellCheck={false}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 pr-12 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors text-xs"
              tabIndex={-1}
            >
              {showPassword ? "隠す" : "表示"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-7 py-3.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer transition-all duration-300 hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>

          <p className="text-center text-[11px] text-text-muted mt-4 leading-relaxed">
            パスワードをお忘れの方は
            <br />
            担当者までご連絡ください
          </p>
        </form>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
