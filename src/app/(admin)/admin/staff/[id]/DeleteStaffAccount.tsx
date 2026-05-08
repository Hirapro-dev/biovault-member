"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteStaffAccount({
  staffId,
  staffCode,
  hasLogin,
}: {
  staffId: string;
  staffCode: string;
  hasLogin: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (confirmCode !== staffCode) {
      setError("従業員コードが一致しません");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/staff/${staffId}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmCode }),
      });

      if (res.ok) {
        router.push("/admin/staff");
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
            従業員アカウントの削除
          </h4>

          <div className="text-xs text-text-secondary leading-relaxed mb-4 space-y-2">
            <p className="text-status-danger font-medium">⚠ この操作は取り消せません</p>
            <p>以下のデータが削除されます：</p>
            <ul className="list-disc pl-5 space-y-1 text-text-muted">
              <li>従業員レコード（基本情報・備考）</li>
              {hasLogin && <li>ログイン用ユーザーアカウント・ログイン情報</li>}
              <li>紹介リンク（担当顧客・担当代理店の紐付けは解除されます）</li>
            </ul>
            <p className="text-text-muted">※ 担当していた顧客・代理店データ自体は削除されません</p>
            <p className="text-text-muted">※ 過去の報酬履歴は残りますが、担当者欄は空になります</p>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-text-secondary mb-2">
              削除を確定するには、従業員コード <span className="font-mono text-status-danger">{staffCode}</span> を入力してください
            </label>
            <input
              type="text"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              value={confirmCode}
              onChange={(e) => { setConfirmCode(e.target.value.toUpperCase()); setError(""); }}
              placeholder={staffCode}
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
              disabled={loading || confirmCode !== staffCode}
              className="flex-1 py-2.5 bg-status-danger border-none rounded-sm text-white text-[13px] font-semibold tracking-wider cursor-pointer transition-all hover:opacity-90 disabled:opacity-30"
            >
              {loading ? "削除中..." : "完全に削除する"}
            </button>
            <button
              onClick={() => { setOpen(false); setConfirmCode(""); setError(""); }}
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
