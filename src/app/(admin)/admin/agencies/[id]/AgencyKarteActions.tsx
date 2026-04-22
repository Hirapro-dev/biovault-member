"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AgencyKarteActions({
  userId, agencyProfileId, currentRate,
  bankName: bn, bankBranch: bb, bankAccountType: bat, bankAccountNumber: ban, bankAccountName: baN,
}: {
  userId: string; agencyProfileId: string; currentRate: number;
  bankName: string; bankBranch: string; bankAccountType: string; bankAccountNumber: string; bankAccountName: string;
}) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showAddCommission, setShowAddCommission] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // 編集フォーム
  const [rate, setRate] = useState(String(currentRate));
  const [bankName, setBankName] = useState(bn);
  const [bankBranch, setBankBranch] = useState(bb);
  const [bankAccountType, setBankAccountType] = useState(bat);
  const [bankAccountNumber, setBankAccountNumber] = useState(ban);
  const [bankAccountName, setBankAccountName] = useState(baN);

  // 報酬追加フォーム
  const [commForm, setCommForm] = useState({
    memberName: "", memberNumber: "", memberUserId: "",
    orderKey: "", // 選択された売上対象 ("ips:xxx" or "cf:xxx")
    saleAmount: "", commissionRate: String(currentRate),
    contributionType: "紹介のみ", status: "PENDING",
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

  const handleSaveProfile = async () => {
    setSaving(true);
    await fetch(`/api/admin/agencies/${agencyProfileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commissionRate: parseFloat(rate), bankName, bankBranch, bankAccountType, bankAccountNumber, bankAccountName }),
    });
    setSaving(false);
    setShowEdit(false);
    setMessage("更新しました");
    router.refresh();
    setTimeout(() => setMessage(""), 3000);
  };

  const handleAddCommission = async () => {
    setSaving(true);
    const amt = parseInt(commForm.saleAmount);
    const r = parseFloat(commForm.commissionRate);
    // 紹介された会員の userId を優先、見つからなければ後方互換で代理店の userId を送る
    const targetUserId = commForm.memberUserId || userId;
    // note: どのオーダーに対する報酬かの情報を保存
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
        contributionType: commForm.contributionType,
        status: commForm.status,
        note,
      }),
    });
    setSaving(false);
    setShowAddCommission(false);
    setCommForm({ memberName: "", memberNumber: "", memberUserId: "", orderKey: "", saleAmount: "", commissionRate: String(currentRate), contributionType: "紹介のみ", status: "PENDING" });
    setLookupStatus("idle");
    setOrderOptions([]);
    setMessage("報酬を追加しました");
    router.refresh();
    setTimeout(() => setMessage(""), 3000);
  };

  const ic = "w-full px-3 py-2 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none focus:border-border-gold";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5">
      {message && <div className="sm:col-span-2 p-2 bg-status-active/10 border border-status-active/20 rounded text-status-active text-[11px]">{message}</div>}

      {/* 報酬率・振込先編集 */}
      <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
        <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">報酬設定・振込先</h3>
        {!showEdit ? (
          <button onClick={() => setShowEdit(true)} className="w-full py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold cursor-pointer">報酬率・振込先を編集</button>
        ) : (
          <div className="space-y-3">
            <div><label className="block text-xs text-text-secondary mb-1">報酬率(%)</label><input type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} className={ic} /></div>
            <div><label className="block text-xs text-text-secondary mb-1">銀行名</label><input value={bankName} onChange={(e) => setBankName(e.target.value)} className={ic} /></div>
            <div><label className="block text-xs text-text-secondary mb-1">支店名</label><input value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} className={ic} /></div>
            <div><label className="block text-xs text-text-secondary mb-1">口座種別</label>
              <select value={bankAccountType} onChange={(e) => setBankAccountType(e.target.value)} className={ic + " cursor-pointer"}>
                <option value="">選択</option><option value="普通">普通</option><option value="当座">当座</option>
              </select>
            </div>
            <div><label className="block text-xs text-text-secondary mb-1">口座番号</label><input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className={ic + " font-mono"} /></div>
            <div><label className="block text-xs text-text-secondary mb-1">口座名義</label><input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className={ic} /></div>
            <div className="flex gap-2">
              <button onClick={handleSaveProfile} disabled={saving} className="flex-1 py-2 bg-gold-gradient text-bg-primary text-xs font-semibold rounded-sm cursor-pointer disabled:opacity-50">{saving ? "..." : "保存"}</button>
              <button onClick={() => setShowEdit(false)} className="px-4 py-2 border border-border text-text-secondary rounded-sm text-xs cursor-pointer">取消</button>
            </div>
          </div>
        )}
      </div>

      {/* 報酬追加 */}
      <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
        <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">報酬を追加</h3>
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

            {/* 売上対象（会員番号がヒットしたら選択肢を出す） */}
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
                {selectedOrder && (
                  <div className="mt-1 text-[10px] text-text-muted">
                    {selectedOrder.paid ? (
                      <span className="text-status-active">✓ 入金済のオーダーです</span>
                    ) : (
                      <span className="text-status-warning">⚠ 未入金のオーダーです（入金後に確定してください）</span>
                    )}
                  </div>
                )}
              </div>
            )}
            {lookupStatus === "found" && orderOptions.length === 0 && (
              <div className="text-[10px] text-text-muted">この会員には売上対象となるオーダーがありません</div>
            )}

            <div>
              <label className="block text-xs text-text-secondary mb-1">
                売上金額(円) <span className="text-[10px] text-text-muted">（売上対象を選ぶと自動入力）</span>
              </label>
              <input
                type="number"
                value={commForm.saleAmount}
                onChange={(e) => setCommForm({ ...commForm, saleAmount: e.target.value })}
                readOnly={!!selectedOrder}
                className={ic + " font-mono" + (selectedOrder ? " cursor-not-allowed opacity-90" : "")}
              />
            </div>
            <div><label className="block text-xs text-text-secondary mb-1">報酬率(%)</label><input type="number" step="0.1" value={commForm.commissionRate} onChange={(e) => setCommForm({ ...commForm, commissionRate: e.target.value })} className={ic} /></div>
            <div><label className="block text-xs text-text-secondary mb-1">貢献タイプ</label>
              <select value={commForm.contributionType} onChange={(e) => setCommForm({ ...commForm, contributionType: e.target.value })} className={ic + " cursor-pointer"}>
                <option value="紹介のみ">紹介のみ</option><option value="説明補助">説明補助</option><option value="クロージング協力">クロージング協力</option>
              </select>
            </div>
            <div><label className="block text-xs text-text-secondary mb-1">ステータス</label>
              <select value={commForm.status} onChange={(e) => setCommForm({ ...commForm, status: e.target.value })} className={ic + " cursor-pointer"}>
                <option value="PENDING">未確定</option><option value="CONFIRMED">確定</option><option value="PAID">支払済</option>
              </select>
            </div>
            {commForm.saleAmount && commForm.commissionRate && (
              <div className="text-sm text-gold font-mono">報酬額: ¥{Math.floor(parseInt(commForm.saleAmount || "0") * parseFloat(commForm.commissionRate || "0") / 100).toLocaleString()}</div>
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
