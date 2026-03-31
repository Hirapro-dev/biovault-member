"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteAccount({ userId, loginId }: { userId: string; loginId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (confirmId !== loginId) {
      setError("ログインIDが一致しません");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/members/${userId}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmLoginId: confirmId }),
      });

      if (res.ok) {
        router.push("/admin/members");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "削除に失敗しました");
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 pt-6 border-t border-border">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-text-muted hover:text-status-danger transition-colors cursor-pointer"
        >
          アカウントを削除する
        </button>
      ) : (
        <div className="bg-bg-secondary border border-status-danger/30 rounded-md p-5">
          <h4 className="text-sm text-status-danger font-medium mb-3">
            アカウントの削除
          </h4>

          <div className="text-xs text-text-secondary leading-relaxed mb-4 space-y-2">
            <p className="text-status-danger font-medium">⚠ この操作は取り消せません</p>
            <p>以下のデータがすべて完全に削除されます：</p>
            <ul className="list-disc pl-5 space-y-1 text-text-muted">
              <li>会員アカウント・ログイン情報</li>
              <li>会員権・契約情報</li>
              <li>契約書類・アップロードされたPDF</li>
              <li>iPS細胞ステータス・履歴</li>
              <li>投与記録</li>
              <li>管理者メモ</li>
            </ul>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-text-secondary mb-2">
              削除を確定するには、ログインID <span className="font-mono text-status-danger">{loginId}</span> を入力してください
            </label>
            <input
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={confirmId}
              onChange={(e) => { setConfirmId(e.target.value.toLowerCase()); setError(""); }}
              placeholder={loginId}
              className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none transition-colors focus:border-status-danger/50"
            />
          </div>

          {error && (
            <div className="mb-3 p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-[11px]">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={loading || confirmId !== loginId}
              className="flex-1 py-2.5 bg-status-danger border-none rounded-sm text-white text-[13px] font-semibold tracking-wider cursor-pointer transition-all hover:opacity-90 disabled:opacity-30"
            >
              {loading ? "削除中..." : "完全に削除する"}
            </button>
            <button
              onClick={() => { setOpen(false); setConfirmId(""); setError(""); }}
              className="px-5 py-2.5 border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold transition-all"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
