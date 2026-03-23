"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("新しいパスワードが一致しません");
      return;
    }

    if (newPassword.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "パスワードの変更に失敗しました");
      } else {
        setMessage("パスワードを変更しました");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="font-serif-jp text-[22px] font-normal text-text-primary tracking-[2px] mb-7">
        アカウント設定
      </h2>

      <div className="bg-bg-secondary border border-border rounded-md p-8 max-w-[560px]">
        <h3 className="font-serif-jp text-sm font-normal text-text-primary tracking-wider mb-6 pb-3 border-b border-border">
          パスワード変更
        </h3>

        {(session?.user as any)?.mustChangePassword && (
          <div className="mb-6 p-3 bg-status-warning/10 border border-status-warning/20 rounded text-status-warning text-xs">
            初回ログインのためパスワードの変更が必要です
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          {message && (
            <div className="mb-4 p-3 bg-status-active/10 border border-status-active/20 rounded text-status-active text-xs">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-xs">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-[11px] text-text-secondary tracking-[2px] mb-2">
              現在のパスワード
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold"
            />
          </div>

          <div className="mb-5">
            <label className="block text-[11px] text-text-secondary tracking-[2px] mb-2">
              新しいパスワード
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold"
            />
          </div>

          <div className="mb-6">
            <label className="block text-[11px] text-text-secondary tracking-[2px] mb-2">
              新しいパスワード（確認）
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer transition-all duration-300 hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "変更中..." : "パスワードを変更"}
          </button>
        </form>
      </div>
    </div>
  );
}
