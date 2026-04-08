"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";

export default function StaffSettingsPage() {
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [loginId, setLoginId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // パスワード変更
  const [newPassword, setNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    fetch("/api/staff/settings")
      .then(r => r.json())
      .then(data => {
        if (data.email) {
          setEmail(data.email);
          setOriginalEmail(data.email);
        }
        if (data.loginId) setLoginId(data.loginId);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // メールアドレス保存
  const handleSaveEmail = async () => {
    setSaving(true); setMessage(""); setError("");
    try {
      const res = await fetch("/api/staff/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setMessage("メールアドレスを更新しました");
        setOriginalEmail(email);
      } else {
        const d = await res.json();
        setError(d.error || "エラーが発生しました");
      }
    } catch { setError("エラーが発生しました"); }
    finally { setSaving(false); }
  };

  // パスワード変更
  const handleChangePassword = async () => {
    setPwSaving(true); setPwMessage(""); setPwError("");
    try {
      const res = await fetch("/api/staff/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) {
        setPwMessage("パスワードを変更しました");
        setNewPassword("");
      } else {
        const d = await res.json();
        setPwError(d.error || "エラーが発生しました");
      }
    } catch { setPwError("エラーが発生しました"); }
    finally { setPwSaving(false); }
  };

  if (loading) {
    return <div className="text-text-muted text-sm py-8 text-center">読み込み中...</div>;
  }

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        設定
      </h2>

      {/* ログインID（変更不可） */}
      <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6 mb-5">
        <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">ログインID</h3>
        <div className="font-mono text-sm text-text-primary">{loginId}</div>
        <div className="text-[10px] text-text-muted mt-1">※ ログインIDは変更できません</div>
      </div>

      {/* メールアドレス変更 */}
      <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6 mb-5">
        <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">メールアドレス</h3>

        {message && <div className="mb-3 p-2 bg-status-active/10 border border-status-active/20 rounded text-status-active text-[11px]">{message}</div>}
        {error && <div className="mb-3 p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-[11px]">{error}</div>}

        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none focus:border-border-gold transition-colors"
            placeholder="メールアドレス"
          />
          <button
            onClick={handleSaveEmail}
            disabled={saving || email === originalEmail || !email}
            className="px-5 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      {/* パスワード変更 */}
      <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6 mb-5">
        <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">パスワード変更</h3>

        {pwMessage && <div className="mb-3 p-2 bg-status-active/10 border border-status-active/20 rounded text-status-active text-[11px]">{pwMessage}</div>}
        {pwError && <div className="mb-3 p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-[11px]">{pwError}</div>}

        <div className="flex gap-2">
          <input
            type="text"
            inputMode="url"
            autoCapitalize="none"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="flex-1 px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none focus:border-border-gold transition-colors"
            placeholder="新しいパスワード（8文字以上）"
          />
          <button
            onClick={handleChangePassword}
            disabled={pwSaving || newPassword.length < 8}
            className="px-5 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50"
          >
            {pwSaving ? "変更中..." : "変更"}
          </button>
        </div>
      </div>

      {/* ログアウト */}
      <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full py-3 bg-transparent border border-border text-text-secondary rounded text-sm cursor-pointer hover:border-status-danger hover:text-status-danger transition-all"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}
