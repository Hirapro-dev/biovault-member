"use client";

/**
 * ご紹介協力者の承認モーダル（admin用）
 * 管理者がログインID・初回パスワードを指定して発行する。
 * 承認するとログイン情報とご紹介用URLが協力者へメール送付される。
 */

import { useState } from "react";

export default function ApproveModal({
  targetName,
  initialLoginId,
  onSubmit,
  onClose,
}: {
  targetName: string;
  initialLoginId: string;
  onSubmit: (loginId: string, password: string) => Promise<string | null>; // 戻り値: エラーメッセージ(成功時null)
  onClose: () => void;
}) {
  const [loginId, setLoginId] = useState(initialLoginId);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 8文字の英数字パスワードを生成（紛らわしい文字は除外）
  const generate = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let pw = "";
    for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setPassword(pw);
  };

  const submit = async () => {
    if (!loginId.trim() || !password.trim()) {
      setError("ログインIDとパスワードを入力してください");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const err = await onSubmit(loginId.trim(), password.trim());
      if (err) {
        setError(err);
        return;
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-md border border-border bg-bg-secondary p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[15px] text-text-primary mb-1">協力者を承認してログイン発行</h3>
        <p className="text-[12px] text-text-muted mb-4">
          {targetName} さんに、以下のログイン情報とご紹介用URLをメールで送付します。
        </p>

        <div className="mb-3">
          <div className="text-[11px] text-text-muted mb-1">ログインID</div>
          <input
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            className="w-full bg-bg-primary border border-border rounded px-3 py-2 text-[13px] text-text-primary font-mono"
          />
        </div>
        <div className="mb-4">
          <div className="text-[11px] text-text-muted mb-1">初回パスワード</div>
          <div className="flex gap-2">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="初回パスワードを入力"
              className="flex-1 bg-bg-primary border border-border rounded px-3 py-2 text-[13px] text-text-primary font-mono"
            />
            <button
              onClick={generate}
              type="button"
              className="px-3 py-2 rounded border border-border text-[12px] text-text-primary hover:border-gold whitespace-nowrap"
            >
              自動生成
            </button>
          </div>
          <p className="text-[11px] text-text-muted mt-1.5">※ 初回ログイン時に本人がパスワードを変更します</p>
        </div>

        {error && (
          <p className="mb-3 rounded border border-red-400/30 bg-red-400/10 px-3 py-2 text-[12px] text-red-400">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded border border-border text-[13px] text-text-primary hover:border-gold disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={submit}
            disabled={submitting || !loginId.trim() || !password.trim()}
            className="px-4 py-2 rounded bg-gold/90 text-bg-primary text-[13px] font-bold hover:bg-gold disabled:opacity-50"
          >
            {submitting ? "発行中…" : "承認してメール送付"}
          </button>
        </div>
      </div>
    </div>
  );
}
