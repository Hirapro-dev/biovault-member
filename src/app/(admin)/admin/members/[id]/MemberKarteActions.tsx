"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MemberKarteActions({
  userId,
}: {
  userId: string;
}) {
  const router = useRouter();

  return (
    <NoteForm userId={userId} onSuccess={() => router.refresh()} />
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
