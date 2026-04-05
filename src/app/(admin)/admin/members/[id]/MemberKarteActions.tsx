"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IPS_STATUS_ORDER, IPS_STATUS_LABELS } from "@/types";
import type { IpsStatus } from "@/types";

export default function MemberKarteActions({
  userId,
  currentStatus,
}: {
  userId: string;
  currentStatus: IpsStatus;
}) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
      <StatusChangeForm userId={userId} currentStatus={currentStatus} onSuccess={() => router.refresh()} />
      <NoteForm userId={userId} onSuccess={() => router.refresh()} />
    </div>
  );
}

function StatusChangeForm({
  userId,
  currentStatus,
  onSuccess,
}: {
  userId: string;
  currentStatus: IpsStatus;
  onSuccess: () => void;
}) {
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 全ステータスを選択可能（間違った際に戻せるように）
  const availableStatuses = IPS_STATUS_ORDER.filter((s) => s !== currentStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus || !note) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/members/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus, note }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "更新に失敗しました");
      } else {
        setNewStatus("");
        setNote("");
        onSuccess();
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-secondary border border-border rounded-md p-6">
      <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
        ステータス変更
      </h3>

      <div className="mb-3 text-[11px] text-text-muted">
        現在: <span className="text-gold">{IPS_STATUS_LABELS[currentStatus]}</span>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-3 p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-xs">
            {error}
          </div>
        )}

        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          required
          className="w-full px-4 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none mb-3 cursor-pointer"
        >
          <option value="">変更先を選択</option>
          {availableStatuses.map((status) => (
            <option key={status} value={status}>
              {IPS_STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="変更理由（必須）"
          required
          rows={3}
          className="w-full px-4 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none resize-none mb-3"
        />

        <button
          type="submit"
          disabled={loading || !newStatus || !note}
          className="w-full py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer transition-all duration-300 hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "更新中..." : "ステータスを変更"}
        </button>
      </form>
    </div>
  );
}

function NoteForm({
  userId,
  onSuccess,
}: {
  userId: string;
  onSuccess: () => void;
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/members/${userId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "追加に失敗しました");
      } else {
        setContent("");
        onSuccess();
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-secondary border border-border rounded-md p-6">
      <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
        メモ追加
      </h3>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-3 p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-xs">
            {error}
          </div>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="メモを入力..."
          required
          rows={5}
          className="w-full px-4 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none resize-none mb-3"
        />

        <button
          type="submit"
          disabled={loading || !content}
          className="w-full py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer transition-all duration-300 hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "追加中..." : "メモを追加"}
        </button>
      </form>
    </div>
  );
}
