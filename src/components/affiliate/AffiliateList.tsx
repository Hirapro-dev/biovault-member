"use client";

// 紹介協力者一覧（admin用）
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AFFILIATE_CHANNEL_LABELS,
  AFFILIATE_STATUS_LABELS,
} from "@/lib/affiliate-labels";

type Row = {
  id: string;
  affiliateCode: string;
  channel: string;
  status: string;
  displayName: string | null;
  name: string;
  email: string;
  clicks: number;
  leads: number;
  conversions: number;
  totalConfirmed: number;
  totalPending: number;
  createdAt: string;
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-status-warning/10 text-status-warning border-status-warning/20",
  ACTIVE: "bg-status-active/10 text-status-active border-status-active/20",
  SUSPENDED: "bg-text-muted/10 text-text-muted border-text-muted/20",
};

export default function AffiliateList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/affiliates");
      const data = await res.json();
      if (res.ok) setRows(data.affiliates);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id: string) => {
    if (!confirm("この協力者を承認し、ログイン情報をメールで送付します。よろしいですか？")) return;
    setMessage("");
    const res = await fetch(`/api/admin/affiliates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    const data = await res.json();
    setMessage(res.ok ? "承認し、ログイン情報を送付しました" : data.error || "承認に失敗しました");
    await load();
  };

  return (
    <div>
      {message && (
        <div className="mb-4 rounded border border-gold/30 bg-gold/5 px-4 py-2.5 text-[13px] text-gold">
          {message}
        </div>
      )}
      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-text-muted text-sm">読み込み中…</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">紹介協力者はまだいません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-border">
                  {["コード", "氏名", "チャネル", "状態", "クリック", "リード", "成約", "確定報酬", "承認待ち報酬", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border">
                    <td className="px-4 py-3 font-mono text-[13px] text-gold whitespace-nowrap">
                      <Link href={`/admin/affiliates/${r.id}`} className="hover:underline">
                        {r.affiliateCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-text-primary whitespace-nowrap">
                      {r.name}
                      {r.displayName && (
                        <span className="text-[11px] text-text-muted ml-1.5">（{r.displayName}）</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-text-primary whitespace-nowrap">
                      {AFFILIATE_CHANNEL_LABELS[r.channel]}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] border ${STATUS_BADGE[r.status] || ""}`}>
                        {AFFILIATE_STATUS_LABELS[r.status] || r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-text-primary text-right">{r.clicks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[13px] text-text-primary text-right">{r.leads.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[13px] text-text-primary text-right">{r.conversions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[13px] text-gold text-right whitespace-nowrap">
                      ¥{r.totalConfirmed.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-text-muted text-right whitespace-nowrap">
                      ¥{r.totalPending.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.status === "PENDING" && (
                        <button
                          onClick={() => approve(r.id)}
                          className="px-3 py-1 rounded bg-gold/90 text-bg-primary text-[12px] font-bold hover:bg-gold transition-colors"
                        >
                          承認
                        </button>
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
