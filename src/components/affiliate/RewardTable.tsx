"use client";

// ご紹介協力報酬の管理テーブル（admin用: 承認・支払・却下）
import { useCallback, useEffect, useState } from "react";
import {
  AFFILIATE_CHANNEL_LABELS,
  AFFILIATE_REWARD_TYPE_LABELS,
  AFFILIATE_REWARD_STATUS_LABELS,
} from "@/lib/affiliate-labels";

type Reward = {
  id: string;
  rewardType: string;
  rewardAmount: number;
  status: string;
  memberName: string | null;
  memberNumber: string | null;
  note: string | null;
  paidAt: string | null;
  createdAt: string;
  affiliateProfile: {
    affiliateCode: string;
    channel: string;
    displayName: string | null;
    user: { name: string };
  };
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-status-warning/10 text-status-warning border-status-warning/20",
  CONFIRMED: "bg-status-active/10 text-status-active border-status-active/20",
  PAID: "bg-gold/10 text-gold border-gold/20",
  CANCELLED: "bg-text-muted/10 text-text-muted border-text-muted/20",
};

export default function RewardTable() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/affiliate-rewards");
      const data = await res.json();
      if (res.ok) setRewards(data.rewards);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, action: string, confirmMsg: string, doneMsg: string) => {
    if (!confirm(confirmMsg)) return;
    setMessage("");
    const res = await fetch("/api/admin/affiliate-rewards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const data = await res.json();
    setMessage(res.ok ? doneMsg : data.error || "操作に失敗しました");
    await load();
  };

  // 金額修正（承認待ちのみ）
  const editAmount = async (r: Reward) => {
    const input = prompt("報酬金額を入力してください（円）", String(r.rewardAmount));
    if (input === null) return;
    const amount = parseInt(input.replace(/[^0-9]/g, ""), 10);
    if (!Number.isFinite(amount) || amount < 0) {
      setMessage("金額が不正です");
      return;
    }
    setMessage("");
    const res = await fetch("/api/admin/affiliate-rewards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, action: "setAmount", amount }),
    });
    const data = await res.json();
    setMessage(res.ok ? "金額を修正しました" : data.error || "修正に失敗しました");
    await load();
  };

  const filtered = rewards.filter(
    (r) => (!statusFilter || r.status === statusFilter) && (!typeFilter || r.rewardType === typeFilter)
  );

  const pendingTotal = rewards.filter((r) => r.status === "PENDING").reduce((s, r) => s + r.rewardAmount, 0);
  const confirmedTotal = rewards.filter((r) => r.status === "CONFIRMED").reduce((s, r) => s + r.rewardAmount, 0);
  const paidTotal = rewards.filter((r) => r.status === "PAID").reduce((s, r) => s + r.rewardAmount, 0);

  return (
    <div>
      {/* サマリー */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          ["承認待ち", pendingTotal],
          ["承認済み（未払い）", confirmedTotal],
          ["支払済み", paidTotal],
        ].map(([label, total]) => (
          <div key={label as string} className="bg-bg-secondary border border-border rounded p-3 text-center">
            <div className="text-[11px] text-text-muted mb-1">{label}</div>
            <div className="text-[18px] text-gold font-medium">¥{(total as number).toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* フィルタ */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[11px] text-text-muted">状態:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-bg-secondary border border-border rounded px-2 py-1 text-[12px] text-text-primary"
        >
          <option value="">全て</option>
          {Object.entries(AFFILIATE_REWARD_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <span className="text-[11px] text-text-muted ml-2">種別:</span>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-bg-secondary border border-border rounded px-2 py-1 text-[12px] text-text-primary"
        >
          <option value="">全て</option>
          {Object.entries(AFFILIATE_REWARD_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {message && (
        <div className="mb-4 rounded border border-gold/30 bg-gold/5 px-4 py-2.5 text-[13px] text-gold">{message}</div>
      )}

      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-text-muted text-sm">読み込み中…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">報酬レコードはありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[860px]">
              <thead>
                <tr className="border-b border-border">
                  {["発生日", "協力者", "種別", "対象", "金額", "状態", "操作"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border">
                    <td className="px-4 py-3 text-[12px] text-text-muted whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-4 py-3 text-[13px] whitespace-nowrap">
                      <span className="font-mono text-gold mr-2">{r.affiliateProfile.affiliateCode}</span>
                      <span className="text-text-primary">{r.affiliateProfile.user.name}</span>
                      <span className="text-[11px] text-text-muted ml-1.5">
                        {AFFILIATE_CHANNEL_LABELS[r.affiliateProfile.channel]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-text-primary whitespace-nowrap">
                      {AFFILIATE_REWARD_TYPE_LABELS[r.rewardType]}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-text-primary whitespace-nowrap">
                      {r.memberName || "---"}
                      {r.memberNumber && <span className="text-[11px] text-text-muted ml-1">({r.memberNumber})</span>}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gold text-right whitespace-nowrap">
                      ¥{r.rewardAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] border ${STATUS_BADGE[r.status] || ""}`}>
                        {AFFILIATE_REWARD_STATUS_LABELS[r.status] || r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap space-x-1.5">
                      {r.status === "PENDING" && (
                        <>
                          <ActionBtn
                            label="承認"
                            primary
                            onClick={() =>
                              act(r.id, "confirm", "承認すると協力者へ確定通知メールが送信されます。よろしいですか？", "承認しました（通知メール送信済み）")
                            }
                          />
                          <ActionBtn label="金額修正" onClick={() => editAmount(r)} />
                          <ActionBtn
                            label="却下"
                            onClick={() => act(r.id, "cancel", "この報酬を却下しますか？", "却下しました")}
                          />
                        </>
                      )}
                      {r.status === "CONFIRMED" && (
                        <>
                          <ActionBtn
                            label="支払済みにする"
                            primary
                            onClick={() => act(r.id, "pay", "支払済みとして記録しますか？", "支払済みにしました")}
                          />
                          <ActionBtn
                            label="承認待ちに戻す"
                            onClick={() => act(r.id, "revert", "承認待ちに戻しますか？", "承認待ちに戻しました")}
                          />
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ label, onClick, primary }: { label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={
        primary
          ? "px-3 py-1 rounded bg-gold/90 text-bg-primary text-[12px] font-bold hover:bg-gold"
          : "px-3 py-1 rounded border border-border text-[12px] text-text-primary hover:border-gold"
      }
    >
      {label}
    </button>
  );
}
