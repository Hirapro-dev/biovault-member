"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import GoldParticles from "@/components/login/GoldParticles";
import GoldDivider from "@/components/ui/GoldDivider";

export default function LoginPage() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      loginId,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("ログインIDまたはパスワードが正しくありません");
      return;
    }

    // セッションからロールを取得してリダイレクト先を分岐
    const session = await getSession();
    const role = (session?.user as any)?.role;

    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center relative overflow-hidden">
      <GoldParticles />
      <div className="relative z-10 w-[90%] max-w-[420px] animate-fade-in">
        {/* ロゴ */}
        <div className="text-center mb-10">
          <div className="text-[12px] tracking-[5px] text-gold-dark mb-4 font-light">
            Special Member&apos;s
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="BioVault"
            className="h-9 w-auto mx-auto"
          />
          <GoldDivider width={120} className="mx-auto mt-4" />
        </div>

        {/* フォーム */}
        <form
          onSubmit={handleSubmit}
          className="bg-bg-secondary border border-border-gold rounded px-6 py-8 sm:px-5 sm:py-10"
        >
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

          <p className="text-center text-[11px] text-text-muted mt-5 leading-relaxed">
            パスワードをお忘れの方は
            <br />
            担当者までご連絡ください
          </p>
        </form>
      </div>
    </div>
  );
}
