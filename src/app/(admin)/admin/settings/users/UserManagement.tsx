"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "全権限者",
  ADMIN: "管理者",
  OPERATOR: "処理者",
  VIEWER: "閲覧者",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-500/15 text-red-400 border border-red-500/20",
  ADMIN: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  OPERATOR: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  VIEWER: "bg-gray-500/15 text-gray-400 border border-gray-500/20",
};

type User = {
  id: string;
  name: string;
  email: string;
  loginId: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

interface Props {
  users: User[];
  currentUserId: string;
  isSuperAdmin: boolean;
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

export default function UserManagement({ users: initialUsers, currentUserId, isSuperAdmin }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);

  // 追加ポップアップ
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", loginId: "", password: generatePassword(), role: "OPERATOR" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [showPw, setShowPw] = useState(true);

  // ロール変更
  const [roleLoading, setRoleLoading] = useState<string | null>(null);

  // 削除確認
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 編集ポップアップ
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", newPassword: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [editShowPw, setEditShowPw] = useState(false);

  const openEditPopup = (user: User) => {
    setEditTarget(user);
    setEditForm({ name: user.name, email: user.email, newPassword: "" });
    setEditError("");
    setEditSuccess("");
    setEditShowPw(false);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setEditError("名前とメールアドレスは必須です");
      return;
    }
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");
    try {
      const payload: Record<string, string> = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
      };
      if (editForm.newPassword) {
        payload.newPassword = editForm.newPassword;
      }
      const res = await fetch(`/api/admin/users/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "エラーが発生しました");
      } else {
        setEditSuccess("更新しました");
        setUsers(prev => prev.map(u => u.id === editTarget.id ? { ...u, name: data.name, email: data.email } : u));
        setTimeout(() => {
          setEditTarget(null);
          setEditSuccess("");
          router.refresh();
        }, 1200);
      }
    } catch {
      setEditError("エラーが発生しました");
    } finally {
      setEditLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!addForm.name || !addForm.email || !addForm.loginId || !addForm.password) {
      setAddError("全ての項目を入力してください");
      return;
    }
    setAddLoading(true);
    setAddError("");
    setAddSuccess("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "エラーが発生しました");
      } else {
        setAddSuccess(`${data.name} を${ROLE_LABELS[data.role]}として追加しました`);
        setTimeout(() => {
          setShowAddPopup(false);
          setAddForm({ name: "", email: "", loginId: "", password: generatePassword(), role: "OPERATOR" });
          setAddSuccess("");
          router.refresh();
        }, 1500);
      }
    } catch {
      setAddError("エラーが発生しました");
    } finally {
      setAddLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setRoleLoading(userId);
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      router.refresh();
    } finally {
      setRoleLoading(null);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    setRoleLoading(userId);
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive } : u));
      router.refresh();
    } finally {
      setRoleLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" });
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setDeleteLoading(false);
    }
  };

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("ja-JP") : "---";

  // 編集可能かどうか（SUPER_ADMINは全員、それ以外は自分のみ）
  const canEdit = (userId: string) => isSuperAdmin || userId === currentUserId;

  return (
    <>
      {/* ヘッダー + 追加ボタン */}
      {isSuperAdmin && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => { setAddError(""); setAddSuccess(""); setShowAddPopup(true); }}
            className="px-4 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-xs sm:text-[13px] font-semibold tracking-wider hover:opacity-90 transition-all"
          >
            + ユーザー追加
          </button>
        </div>
      )}

      {/* ユーザー一覧 */}
      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {/* モバイル: カードリスト */}
        <div className="sm:hidden divide-y divide-border">
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            return (
              <div key={u.id} className={`p-4 ${!u.isActive ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-primary font-medium">{u.name}</span>
                    {isSelf && <span className="text-[9px] text-gold">(自分)</span>}
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${ROLE_COLORS[u.role] || ""}`}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </div>
                <div className="text-[11px] text-text-muted mb-2">
                  {u.email} / {u.loginId}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {canEdit(u.id) && (
                    <button
                      onClick={() => openEditPopup(u)}
                      className="px-2 py-1.5 border border-border-gold text-gold rounded-sm text-[10px]"
                    >
                      編集
                    </button>
                  )}
                  {isSuperAdmin && !isSelf && (
                    <>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={roleLoading === u.id}
                        className="flex-1 px-2 py-1.5 bg-bg-elevated border border-border rounded-sm text-xs text-text-primary outline-none"
                      >
                        {Object.entries(ROLE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleToggleActive(u.id, !u.isActive)}
                        className={`px-2 py-1.5 border rounded-sm text-[10px] ${u.isActive ? "border-status-danger/30 text-status-danger" : "border-status-active/30 text-status-active"}`}
                      >
                        {u.isActive ? "無効化" : "有効化"}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="px-2 py-1.5 border border-status-danger/30 text-status-danger rounded-sm text-[10px]"
                      >
                        削除
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* PC: テーブル */}
        <table className="w-full border-collapse hidden sm:table">
          <thead>
            <tr className="border-b border-border">
              {["名前", "メール", "ログインID", "ロール", "状態", "最終ログイン", "操作"].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              return (
                <tr key={u.id} className={`border-b border-border ${!u.isActive ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 text-[13px] text-text-primary">
                    {u.name}
                    {isSelf && <span className="text-[9px] text-gold ml-1">(自分)</span>}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-text-muted">{u.email}</td>
                  <td className="px-4 py-3 text-[12px] text-text-muted font-mono">{u.loginId}</td>
                  <td className="px-4 py-3">
                    {!isSuperAdmin || isSelf ? (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${ROLE_COLORS[u.role] || ""}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={roleLoading === u.id}
                        className="px-2 py-1 bg-bg-elevated border border-border rounded-sm text-[11px] text-text-primary outline-none cursor-pointer"
                      >
                        {Object.entries(ROLE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!isSuperAdmin || isSelf ? (
                      <span className={`text-[11px] ${u.isActive ? "text-status-active" : "text-status-danger"}`}>{u.isActive ? "有効" : "無効"}</span>
                    ) : (
                      <button
                        onClick={() => handleToggleActive(u.id, !u.isActive)}
                        disabled={roleLoading === u.id}
                        className={`text-[11px] px-2 py-0.5 rounded-full border cursor-pointer ${
                          u.isActive
                            ? "bg-status-active/10 text-status-active border-status-active/20"
                            : "bg-status-danger/10 text-status-danger border-status-danger/20"
                        }`}
                      >
                        {u.isActive ? "有効" : "無効"}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-text-muted font-mono">{fmtDate(u.lastLoginAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {canEdit(u.id) && (
                        <button
                          onClick={() => openEditPopup(u)}
                          className="px-2 py-1 border border-border-gold text-gold rounded-sm text-[10px] hover:bg-gold/10 transition-all cursor-pointer"
                        >
                          編集
                        </button>
                      )}
                      {isSuperAdmin && !isSelf && (
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="px-2 py-1 border border-status-danger/30 text-status-danger rounded-sm text-[10px] hover:bg-status-danger/10 transition-all cursor-pointer"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 編集ポップアップ */}
      {editTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setEditTarget(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-bg-secondary border border-border-gold rounded-xl p-6 sm:p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif-jp text-base text-gold tracking-wider mb-1">ユーザー情報編集</h3>
            <p className="text-xs text-text-muted mb-5">
              {editTarget.name}
              {editTarget.id === currentUserId && <span className="text-gold ml-1">(自分)</span>}
            </p>

            {editSuccess && <div className="mb-3 p-2 bg-status-active/10 border border-status-active/20 rounded text-status-active text-[11px]">{editSuccess}</div>}
            {editError && <div className="mb-3 p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-[11px]">{editError}</div>}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">名前</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none focus:border-border-gold"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">メールアドレス</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none focus:border-border-gold"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  新しいパスワード <span className="text-text-muted text-[10px]">（変更する場合のみ）</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={editShowPw ? "text" : "password"}
                      value={editForm.newPassword}
                      onChange={(e) => setEditForm(f => ({ ...f, newPassword: e.target.value }))}
                      placeholder="変更しない場合は空欄"
                      className="w-full px-3 py-2.5 pr-12 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none focus:border-border-gold"
                    />
                    {editForm.newPassword && (
                      <button
                        type="button"
                        onClick={() => setEditShowPw(!editShowPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs cursor-pointer"
                        tabIndex={-1}
                      >
                        {editShowPw ? "隠す" : "表示"}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => { setEditForm(f => ({ ...f, newPassword: generatePassword() })); setEditShowPw(true); }}
                    className="px-3 py-2.5 border border-border text-text-muted rounded-sm text-xs hover:text-gold transition-colors cursor-pointer shrink-0"
                  >
                    生成
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">ログインID</label>
                <input
                  value={editTarget.loginId}
                  readOnly
                  className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-muted text-sm font-mono outline-none cursor-not-allowed"
                />
                <div className="text-[10px] text-text-muted mt-1">ログインIDは変更できません</div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2.5 border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold transition-all"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleEdit}
                  disabled={editLoading}
                  className="flex-1 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {editLoading ? "更新中..." : "更新する"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ユーザー追加ポップアップ */}
      {showAddPopup && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowAddPopup(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-bg-secondary border border-border-gold rounded-xl p-6 sm:p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif-jp text-base text-gold tracking-wider mb-2">ユーザー追加</h3>
            <p className="text-xs text-text-muted mb-5">管理画面にアクセスするユーザーを追加します。</p>

            {addSuccess && <div className="mb-3 p-2 bg-status-active/10 border border-status-active/20 rounded text-status-active text-[11px]">{addSuccess}</div>}
            {addError && <div className="mb-3 p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-[11px]">{addError}</div>}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">名前 <span className="text-status-danger">*</span></label>
                <input value={addForm.name} onChange={(e) => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="田中 太郎" className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none focus:border-border-gold" />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">メールアドレス <span className="text-status-danger">*</span></label>
                <input type="email" value={addForm.email} onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="tanaka@example.com" className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none focus:border-border-gold" />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">ログインID <span className="text-status-danger">*</span></label>
                <input inputMode="url" autoCapitalize="none" spellCheck={false} value={addForm.loginId} onChange={(e) => setAddForm(f => ({ ...f, loginId: e.target.value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() }))} placeholder="tanaka01" className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none focus:border-border-gold" />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">パスワード <span className="text-status-danger">*</span></label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type={showPw ? "text" : "password"} value={addForm.password} onChange={(e) => setAddForm(f => ({ ...f, password: e.target.value }))} className="w-full px-3 py-2.5 pr-12 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none focus:border-border-gold" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs cursor-pointer" tabIndex={-1}>{showPw ? "隠す" : "表示"}</button>
                  </div>
                  <button onClick={() => setAddForm(f => ({ ...f, password: generatePassword() }))} className="px-3 py-2.5 border border-border text-text-muted rounded-sm text-xs hover:text-gold transition-colors cursor-pointer">&#x21BB;</button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">ロール <span className="text-status-danger">*</span></label>
                <select value={addForm.role} onChange={(e) => setAddForm(f => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none cursor-pointer focus:border-border-gold">
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <div className="text-[10px] text-text-muted mt-1.5 space-y-0.5">
                  <div><span className="text-red-400">全権限者</span>: 全操作 + ユーザー管理</div>
                  <div><span className="text-blue-400">管理者</span>: 全操作（ユーザー管理以外）</div>
                  <div><span className="text-amber-400">処理者</span>: ステータス更新・日付入力のみ</div>
                  <div><span className="text-gray-400">閲覧者</span>: 閲覧のみ</div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowAddPopup(false)} className="px-4 py-2.5 border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold transition-all">キャンセル</button>
                <button onClick={handleAdd} disabled={addLoading} className="flex-1 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50">
                  {addLoading ? "追加中..." : "追加する"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 削除確認ポップアップ */}
      {deleteTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-bg-secondary border border-status-danger/30 rounded-xl p-6 sm:p-8 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base text-status-danger font-medium mb-2">ユーザー削除</h3>
            <p className="text-sm text-text-secondary mb-4">
              <span className="text-text-primary font-medium">{deleteTarget.name}</span>（{ROLE_LABELS[deleteTarget.role]}）を削除しますか？
            </p>
            <p className="text-[11px] text-text-muted mb-5">この操作は取り消せません。</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 border border-border text-text-secondary rounded-sm text-sm cursor-pointer">キャンセル</button>
              <button onClick={handleDelete} disabled={deleteLoading} className="flex-1 py-2.5 bg-status-danger border-none rounded-sm text-white text-[13px] font-semibold cursor-pointer disabled:opacity-50">
                {deleteLoading ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
