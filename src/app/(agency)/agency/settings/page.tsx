"use client";

import { useState } from "react";

export default function AgencySettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(""); setError("");
    if (newPassword !== confirmPassword) { setError("新しいパスワードが一致しません"); return; }
    if (newPassword.length < 8) { setError("パスワードは8文字以上で入力してください"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
      const data = await res.json();
      if (!res.ok) setError(data.error || "変更に失敗しました");
      else { setMessage("パスワードを変更しました"); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }
    } catch { setError("エラーが発生しました"); }
    finally { setLoading(false); }
  };

  const ic = "w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors focus:border-border-gold";

  return (
    <div className="max-w-[560px]">
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">設定</h2>
      <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-6">
        <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-5 pb-3 border-b border-border">パスワード変更</h3>
        <form onSubmit={handleSubmit}>
          {message && <div className="mb-4 p-3 bg-status-active/10 border border-status-active/20 rounded text-status-active text-xs">{message}</div>}
          {error && <div className="mb-4 p-3 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-xs">{error}</div>}
          <div className="mb-5"><label className="block text-xs text-text-secondary mb-2">現在のパスワード</label><input type="password" inputMode="url" autoCapitalize="none" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className={ic} /></div>
          <div className="mb-5"><label className="block text-xs text-text-secondary mb-2">新しいパスワード</label><input type="password" inputMode="url" autoCapitalize="none" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className={ic} /></div>
          <div className="mb-6"><label className="block text-xs text-text-secondary mb-2">新しいパスワード（確認）</label><input type="password" inputMode="url" autoCapitalize="none" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={ic} /></div>
          <button type="submit" disabled={loading} className="w-full py-3.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50">{loading ? "変更中..." : "パスワードを変更"}</button>
        </form>
      </div>
    </div>
  );
}
