"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * 管理者用: 報酬レコードの手動追加フォーム
 * （基本情報・振込先・報酬率の編集は AgencyInfoEditor に統合済み）
 */
export default function AgencyKarteActions({
  userId,
  agencyProfileId,
  currentRate,
}: {
  userId: string;
  agencyProfileId: string;
  currentRate: number;
}) {
  const router = useRouter();
  const [showAddCommission, setShowAddCommission] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // 報酬追加フォーム
  const [commForm, setCommForm] = useState({
    memberName: "", memberNumber: "", memberUserId: "",
    orderKey: "", // 選択された売上対象 ("ips:xxx" or "cf:xxx")
    saleAmount: "", commissionRate: String(currentRate),
    staffCommissionRate: "0",
    contributionType: "", status: "PENDING",
  });
  // 会員番号ルックアップ状態
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "found" | "notfound">("idle");
  // 売上対象オーダー候補
  type OrderOption = { key: string; label: string; amount: number; paid: boolean; date: string | null };
  const [orderOptions, setOrderOptions] = useState<OrderOption[]>([]);

  // 会員番号が変わったらデバウンスで自動検索
  useEffect(() => {
    const num = commForm.memberNumber.trim();
    if (!num) {
      setLookupStatus("idle");
      setOrderOptions([]);
      return;
    }
    setLookupStatus("loading");
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/members/lookup?memberNumber=${encodeURIComponent(num)}`);
        const data = await res.json();
        if (res.ok && data.found) {
          setCommForm((f) => ({
            ...f,
            memberName: data.user.name,
            memberUserId: data.user.id,
            orderKey: "",
            saleAmount: "",
          }));
          setOrderOptions(data.orders || []);
          setLookupStatus("found");
        } else {
          setCommForm((f) => ({ ...f, memberUserId: "", orderKey: "", saleAmount: "" }));
          setOrderOptions([]);
          setLookupStatus("notfound");
        }
      } catch {
        setLookupStatus("notfound");
        setOrderOptions([]);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [commForm.memberNumber]);

  // 売上対象を選択したら、売上金額を自動入力
  const handleSelectOrder = (key: string) => {
    const order = orderOptions.find((o) => o.key === key);
    setCommForm((f) => ({
      ...f,
      orderKey: key,
      saleAmount: order ? String(order.amount) : "",
    }));
  };

  const selectedOrder = orderOptions.find((o) => o.key === commForm.orderKey);

  const handleAddCommission = async () => {
    setSaving(true);
    const amt = parseInt(commForm.saleAmount);
    const r = parseFloat(commForm.commissionRate);
    const sr = parseFloat(commForm.staffCommissionRate) || 0;
    const targetUserId = commForm.memberUserId || userId;
    const note = selectedOrder ? `対象: ${selectedOrder.label}` : null;

    await fetch(`/api/admin/agencies/${agencyProfileId}/commissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberUserId: targetUserId,
        memberName: commForm.memberName,
        memberNumber: commForm.memberNumber,
        saleAmount: amt,
        commissionRate: r,
        commissionAmount: Math.floor(amt * r / 100),
        staffCommissionRate: sr,
        staffCommissionAmount: Math.floor(amt * sr / 100),
        contributionType: commForm.contributionType,
        status: commForm.status,
        note,
      }),
    });
    setSaving(false);
    setShowAddCommission(false);
    setCommForm({ memberName: "", memberNumber: "", memberUserId: "", orderKey: "", saleAmount: "", commissionRate: String(currentRate), staffCommissionRate: "0", contributionType: "", status: "PENDING" });
    setLookupStatus("idle");
    setOrderOptions([]);
    setMessage("報酬を追加しました");
    router.refresh();
    setTimeout(() => setMessage(""), 3000);
  };

  const ic = "w-full px-3 py-2 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none focus:border-border-gold";

  const amtNum = parseInt(commForm.saleAmount || "0");
  const rNum = parseFloat(commForm.commissionRate || "0");
  const srNum = parseFloat(commForm.staffCommissionRate || "0");

  return (
    <div className="mb-5">
      {message && <div className="mb-3 p-2 bg-status-active/10 border border-status-active/20 rounded text-status-active text-[11px]">{message}</div>}

      <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
        <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">
          報酬を追加（手動・イレギュラー対応）
        </h3>
        {!showAddCommission ? (
          <button onClick={() => setShowAddCommission(true)} className="w-full py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold cursor-pointer">+ 報酬レコードを追加</button>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">会員番号</label>
              <input
                value={commForm.memberNumber}
                onChange={(e) => setCommForm({ ...commForm, memberNumber: e.target.value, memberName: "", memberUserId: "" })}
                placeholder="BV-0001"
                className={ic + " font-mono"}
              />
              {commForm.memberNumber && (
                <div className="mt-1 text-[10px]">
                  {lookupStatus === "loading" && <span className="text-text-muted">検索中...</span>}
                  {lookupStatus === "found" && <span className="text-status-active">✓ 一致する会員が見つかりました</span>}
                  {lookupStatus === "notfound" && <span className="text-status-danger">該当する会員が見つかりません</span>}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">顧客名 <span className="text-[10px] text-text-muted">（会員番号から自動補完）</span></label>
              <input
                value={commForm.memberName}
                onChange={(e) => setCommForm({ ...commForm, memberName: e.target.value })}
                readOnly={lookupStatus === "found"}
                placeholder="会員番号を入力すると自動入力されます"
                className={ic + (lookupStatus === "found" ? " cursor-not-allowed opacity-90" : "")}
              />
            </div>

            {lookupStatus === "found" && orderOptions.length > 0 && (
              <div>
                <label className="block text-xs text-text-secondary mb-1">売上対象</label>
                <select
                  value={commForm.orderKey}
                  onChange={(e) => handleSelectOrder(e.target.value)}
                  className={ic + " cursor-pointer"}
                >
                  <option value="">選択してください</option>
                  {orderOptions.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}（¥{o.amount.toLocaleString()}）{o.paid ? " ✓入金済" : " ⚠未入金"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs text-text-secondary mb-1">売上金額(円)</label>
              <input
                type="number"
                value={commForm.saleAmount}
                onChange={(e) => setCommForm({ ...commForm, saleAmount: e.target.value })}
                readOnly={!!selectedOrder}
                className={ic + " font-mono" + (selectedOrder ? " cursor-not-allowed opacity-90" : "")}
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">代理店報酬率(%)</label>
              <input type="number" step="0.1" value={commForm.commissionRate} onChange={(e) => setCommForm({ ...commForm, commissionRate: e.target.value })} className={ic + " font-mono"} />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">営業マン報酬率(%)</label>
              <input type="number" step="0.1" value={commForm.staffCommissionRate} onChange={(e) => setCommForm({ ...commForm, staffCommissionRate: e.target.value })} className={ic + " font-mono"} />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">備考 <span className="text-[10px] text-text-muted">（自由入力）</span></label>
              <input
                type="text"
                value={commForm.contributionType}
                onChange={(e) => setCommForm({ ...commForm, contributionType: e.target.value })}
                placeholder="例: 紹介のみ、説明補助 など"
                className={ic}
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">ステータス</label>
              <select value={commForm.status} onChange={(e) => setCommForm({ ...commForm, status: e.target.value })} className={ic + " cursor-pointer"}>
                <option value="PENDING">未確定</option><option value="CONFIRMED">確定</option><option value="PAID">支払済</option>
              </select>
            </div>
            {amtNum > 0 && (
              <div className="text-[12px] text-gold font-mono">
                代理店報酬: ¥{Math.floor(amtNum * rNum / 100).toLocaleString()}
                {srNum > 0 && <span className="ml-3">営業マン報酬: ¥{Math.floor(amtNum * srNum / 100).toLocaleString()}</span>}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={handleAddCommission} disabled={saving || !commForm.memberName || !commForm.saleAmount} className="flex-1 py-2 bg-gold-gradient text-bg-primary text-xs font-semibold rounded-sm cursor-pointer disabled:opacity-50">{saving ? "..." : "追加"}</button>
              <button onClick={() => setShowAddCommission(false)} className="px-4 py-2 border border-border text-text-secondary rounded-sm text-xs cursor-pointer">取消</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
