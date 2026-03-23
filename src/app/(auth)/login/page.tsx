"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import GoldParticles from "@/components/login/GoldParticles";
import GoldDivider from "@/components/ui/GoldDivider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center relative overflow-hidden">
      <GoldParticles />
      <div className="relative z-10 w-[420px] animate-fade-in">
        {/* ロゴ */}
        <div className="text-center mb-12">
          <div className="text-[13px] tracking-[8px] text-gold-dark mb-3 font-light">
            MEMBER&apos;S PORTAL
          </div>
          <h1 className="font-serif text-5xl font-light tracking-[6px] text-gold-gradient m-0">
            BioVault
          </h1>
          <GoldDivider width={120} className="mx-auto mt-4" />
        </div>

        {/* フォーム */}
        <form
          onSubmit={handleSubmit}
          className="bg-bg-secondary border border-border-gold rounded p-10"
        >
          {error && (
            <div className="mb-4 p-3 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-xs text-center">
              {error}
            </div>
          )}

          <label className="block text-[11px] text-text-secondary tracking-[2px] mb-2 uppercase">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold mb-5"
          />

          <label className="block text-[11px] text-text-secondary tracking-[2px] mb-2 uppercase">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold"
          />

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
