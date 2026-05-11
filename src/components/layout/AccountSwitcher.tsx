"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type SecondarySessionPublic = {
  userId: string;
  loginId: string;
  role: string;
  name: string;
  addedAt: number;
  expiresAt: number;
};

const ROLE_LABELS: Record<string, string> = {
  MEMBER: "会員",
  AGENCY: "代理店",
  STAFF: "従業員",
  ADMIN: "管理者",
  SUPER_ADMIN: "全権管理者",
  OPERATOR: "処理者",
  VIEWER: "閲覧者",
};

function roleLabel(role: string) {
  return ROLE_LABELS[role] || role;
}

/**
 * アカウント切替UI（ハンバーガーメニュー内に埋め込み）
 *
 * 機能:
 * - 保存中のサブアカウント一覧を表示し、クリックで切替（パスワード再入力なし）
 * - ロールが変わる場合は確認ダイアログ
 * - 「+ 別のアカウントを追加」で現在のセッションを退避してログイン画面へ
 * - 各エントリ右の × で個別削除
 */
export default function AccountSwitcher({
  currentUserId,
  currentUserName,
  currentUserRole,
  onClose,
}: {
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<SecondarySessionPublic[]>([]);
  const [max, setMax] = useState(5);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{
    type: "switch" | "add";
    target?: SecondarySessionPublic;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/secondary/list", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
        setMax(data.max || 5);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSwitchClick = (acc: SecondarySessionPublic) => {
    // ロール変更があれば確認ダイアログ
    if (acc.role !== currentUserRole) {
      setConfirm({ type: "switch", target: acc });
    } else {
      doSwitch(acc);
    }
  };

  const doSwitch = async (acc: SecondarySessionPublic) => {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/secondary/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: acc.userId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "アカウント切替に失敗しました");
        setBusy(false);
        return;
      }
      // 切替成功 → ロール別の初期画面へ
      const initialPath =
        acc.role === "AGENCY"
          ? "/agency"
          : acc.role === "STAFF"
            ? "/staff"
            : ["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes(acc.role)
              ? "/admin"
              : "/mypage";
      onClose?.();
      // セッションは Cookie 入れ替え済み。ハードリロードで NextAuth セッションを再構築
      window.location.href = initialPath;
    } catch {
      alert("アカウント切替に失敗しました");
      setBusy(false);
    }
  };

  const handleAddAccountClick = () => {
    if (accounts.length >= max - 1) {
      // -1 は現在ログイン中の分。サブには max-1 件しか追加できない計算になる
      // ここでは max 件を厳密にチェック
    }
    if (accounts.length >= max) {
      alert(`保存できるアカウントは最大 ${max} 件までです。不要なアカウントを削除してください。`);
      return;
    }
    setConfirm({ type: "add" });
  };

  const doAdd = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/secondary/stash", { method: "POST" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "アカウント追加準備に失敗しました");
        setBusy(false);
        return;
      }
      onClose?.();
      // 退避済み → ログイン画面へ。addAccount=1 で「追加モード」と認識（UIヒント用）
      window.location.href = "/login?addAccount=1";
    } catch {
      alert("アカウント追加準備に失敗しました");
      setBusy(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm) {
      // confirm()ダイアログ（ブラウザネイティブ）
      const ok = window.confirm("このアカウントを保存リストから削除します。よろしいですか？");
      if (!ok) return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/secondary/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        await load();
      } else {
        alert("削除に失敗しました");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="space-y-1">
        {/* 現在ログイン中 */}
        <div className="flex items-center gap-2 px-3 py-2 bg-bg-elevated rounded border border-border-gold">
          <div className="w-2 h-2 bg-status-active rounded-full shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-gold truncate">{currentUserName} 様</div>
            <div className="text-[10px] text-text-muted">{roleLabel(currentUserRole)}（現在ログイン中）</div>
          </div>
        </div>

        {/* 保存済みアカウント一覧 */}
        {loading ? (
          <div className="px-3 py-2 text-[11px] text-text-muted">読込中...</div>
        ) : accounts.length === 0 ? (
          <div className="px-3 py-2 text-[11px] text-text-muted">保存中の他アカウントはありません</div>
        ) : (
          accounts.map((acc) => (
            <div
              key={acc.userId}
              className="flex items-center gap-2 px-3 py-2 rounded border border-border hover:border-border-gold transition-colors"
            >
              <button
                onClick={() => handleSwitchClick(acc)}
                disabled={busy}
                className="flex-1 min-w-0 text-left disabled:opacity-50"
              >
                <div className="text-[12px] text-text-primary truncate">{acc.name} 様</div>
                <div className="text-[10px] text-text-muted">{roleLabel(acc.role)}（{acc.loginId}）</div>
              </button>
              <button
                onClick={() => handleRemove(acc.userId)}
                disabled={busy}
                className="text-text-muted hover:text-status-danger text-xs px-2 py-1 cursor-pointer disabled:opacity-50"
                title="保存リストから削除"
                aria-label="削除"
              >
                ×
              </button>
            </div>
          ))
        )}

        {/* 追加ボタン */}
        <button
          onClick={handleAddAccountClick}
          disabled={busy || accounts.length >= max}
          className="w-full mt-2 px-3 py-2 border border-dashed border-border text-text-secondary rounded text-[11px] hover:border-border-gold hover:text-gold transition-colors cursor-pointer disabled:opacity-50"
        >
          + 別のアカウントを追加
        </button>
        <p className="text-[10px] text-text-muted px-1 mt-1">
          最大 {max} アカウントまで保存可能
        </p>
      </div>

      {/* 確認ダイアログ */}
      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => !busy && setConfirm(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative bg-bg-secondary border border-border-gold rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            {confirm.type === "switch" && confirm.target && (
              <>
                <h3 className="text-base text-gold mb-3">アカウントを切り替えます</h3>
                <p className="text-xs text-text-secondary mb-2">
                  権限が <span className="text-gold">{roleLabel(currentUserRole)}</span> から <span className="text-gold">{roleLabel(confirm.target.role)}</span> に変わります。
                </p>
                <p className="text-xs text-text-muted mb-5">
                  切替先: {confirm.target.name} 様（{confirm.target.loginId}）
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirm(null)}
                    disabled={busy}
                    className="flex-1 py-2 border border-border text-text-secondary rounded-sm text-xs cursor-pointer hover:border-border-gold transition-all"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => doSwitch(confirm.target!)}
                    disabled={busy}
                    className="flex-1 py-2 bg-gold-gradient border-none rounded-sm text-bg-primary text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {busy ? "切替中..." : "切り替える"}
                  </button>
                </div>
              </>
            )}
            {confirm.type === "add" && (
              <>
                <h3 className="text-base text-gold mb-3">別のアカウントを追加</h3>
                <p className="text-xs text-text-secondary mb-3">
                  このブラウザに現在のアカウント（{currentUserName} 様）の情報を保存し、別アカウントでログイン後にパスワード入力なしで切り替えられるようにします。
                </p>
                <p className="text-[11px] text-status-warning mb-5">
                  ⚠ 共用PC・他人と共有するブラウザではご利用にならないでください。
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirm(null)}
                    disabled={busy}
                    className="flex-1 py-2 border border-border text-text-secondary rounded-sm text-xs cursor-pointer hover:border-border-gold transition-all"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={doAdd}
                    disabled={busy}
                    className="flex-1 py-2 bg-gold-gradient border-none rounded-sm text-bg-primary text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {busy ? "準備中..." : "ログイン画面へ"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        button:disabled { cursor: not-allowed; }
      `}</style>
    </>
  );
}
