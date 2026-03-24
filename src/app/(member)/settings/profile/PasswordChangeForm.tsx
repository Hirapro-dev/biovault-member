"use client";

import { useState } from "react";

export default function PasswordChangeForm({ mustChange }: { mustChange: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-6">
      <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
        パスワード変更
      </h3>

      {mustChange && (
        <div className="mb-4 p-3 bg-status-warning/10 border border-status-warning/20 rounded text-status-warning text-xs">
          初回ログインのためパスワードの変更が必要です
        </div>
      )}

      <form onSubmit={handleSubmit}>
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
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-3 pr-12 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors text-xs"
              tabIndex={-1}
            >
              {showCurrent ? "隠す" : "表示"}
            </button>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-[11px] text-text-secondary tracking-[2px] mb-2">
            新しいパスワード
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 pr-12 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors text-xs"
              tabIndex={-1}
            >
              {showNew ? "隠す" : "表示"}
            </button>
          </div>
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
  );
}
