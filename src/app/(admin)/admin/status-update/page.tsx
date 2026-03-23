"use client";

import { useState, useEffect } from "react";
import { IPS_STATUS_ORDER, IPS_STATUS_LABELS } from "@/types";

interface Member {
  id: string;
  name: string;
  membership?: {
    memberNumber: string;
    ipsStatus: string;
  };
}

export default function StatusUpdatePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/members")
      .then((res) => res.json())
      .then((data) => {
        setMembers(data);
        setFetchLoading(false);
      })
      .catch(() => setFetchLoading(false));
  }, []);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === members.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(members.map((m) => m.id)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.size === 0 || !newStatus || !note) return;

    setLoading(true);
    setMessage("");
    setError("");

    let successCount = 0;
    let failCount = 0;

    for (const userId of selected) {
      try {
        const res = await fetch(`/api/admin/members/${userId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newStatus, note }),
        });
        if (res.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    setLoading(false);

    if (failCount === 0) {
      setMessage(`${successCount}件のステータスを更新しました`);
      setSelected(new Set());
      setNewStatus("");
      setNote("");
      // 会員リストを再取得
      const res = await fetch("/api/admin/members");
      const data = await res.json();
      setMembers(data);
    } else {
      setError(`成功: ${successCount}件、失敗: ${failCount}件`);
    }
  };

  return (
    <div>
      <h2 className="font-serif-jp text-[22px] font-normal text-text-primary tracking-[2px] mb-7">
        ステータス一括更新
      </h2>

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

      <form onSubmit={handleSubmit}>
        {/* 会員選択テーブル */}
        <div className="bg-bg-secondary border border-border rounded-md overflow-hidden mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === members.length && members.length > 0}
                    onChange={toggleAll}
                    className="cursor-pointer"
                  />
                </th>
                <th className="px-5 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal">
                  会員番号
                </th>
                <th className="px-5 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal">
                  氏名
                </th>
                <th className="px-5 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal">
                  現在のステータス
                </th>
              </tr>
            </thead>
            <tbody>
              {fetchLoading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-text-muted text-sm">
                    読み込み中...
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr
                    key={m.id}
                    className={`border-b border-border transition-colors duration-200 cursor-pointer ${
                      selected.has(m.id) ? "bg-gold/5" : "hover:bg-bg-elevated"
                    }`}
                    onClick={() => toggleSelect(m.id)}
                  >
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(m.id)}
                        onChange={() => toggleSelect(m.id)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-3 font-mono text-[13px] text-gold">
                      {m.membership?.memberNumber || "---"}
                    </td>
                    <td className="px-5 py-3 text-[13px]">{m.name}</td>
                    <td className="px-5 py-3">
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-gold/10 text-gold border border-gold/20">
                        {m.membership
                          ? IPS_STATUS_LABELS[m.membership.ipsStatus as keyof typeof IPS_STATUS_LABELS]
                          : "---"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 変更先ステータスと理由 */}
        <div className="grid grid-cols-2 gap-5 mb-6">
          <div>
            <label className="block text-[11px] text-text-secondary tracking-[2px] mb-2">
              変更先ステータス <span className="text-status-danger">*</span>
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none cursor-pointer"
            >
              <option value="">選択してください</option>
              {IPS_STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {IPS_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-text-secondary tracking-[2px] mb-2">
              変更理由 <span className="text-status-danger">*</span>
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="変更理由を入力"
              required
              className="w-full px-4 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || selected.size === 0 || !newStatus || !note}
          className="px-8 py-3 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer transition-all duration-300 hover:opacity-90 disabled:opacity-50"
        >
          {loading
            ? "更新中..."
            : `${selected.size}件のステータスを一括更新`}
        </button>
      </form>
    </div>
  );
}
