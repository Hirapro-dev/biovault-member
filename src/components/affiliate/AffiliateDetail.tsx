"use client";

// ご紹介協力者 詳細（admin用）: 専用URL・状態操作・個別報酬額・実績
import { useCallback, useEffect, useState } from "react";
import {
  AFFILIATE_CHANNEL_LABELS,
  AFFILIATE_STATUS_LABELS,
  AFFILIATE_REWARD_TYPE_LABELS,
  AFFILIATE_REWARD_STATUS_LABELS,
  LEAD_CALL_STATUS_LABELS,
} from "@/lib/affiliate-labels";
import ApproveModal from "@/components/affiliate/ApproveModal";

type Detail = {
  profile: {
    id: string;
    affiliateCode: string;
    channel: string;
    status: string;
    displayName: string | null;
    rewardAmountLead: number | null;
    rewardAmountConversion: number | null;
    bankName: string | null;
    bankBranch: string | null;
    bankAccountType: string | null;
    bankAccountNumber: string | null;
    bankAccountName: string | null;
    createdAt: string;
    user: {
      name: string;
      email: string;
      phone: string | null;
      isIdIssued: boolean;
      lastLoginAt: string | null;
      loginId: string;
    };
    leads: {
      id: string;
      name: string;
      callStatus: string;
      isDuplicate: boolean;
      applicationId: string | null;
      createdAt: string;
    }[];
    rewards: {
      id: string;
      rewardType: string;
      rewardAmount: number;
      status: string;
      memberName: string | null;
      createdAt: string;
    }[];
    _count: { clicks: number };
  };
  lpUrl: string;
};

export default function AffiliateDetail({ id }: { id: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [message, setMessage] = useState("");
  const [rewardLead, setRewardLead] = useState("");
  const [rewardConv, setRewardConv] = useState("");
  const [copied, setCopied] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 削除（協力者コードの確認入力つき・関連データも全削除）
  const handleDelete = async (code: string) => {
    const input = prompt(
      `この協力者を削除すると、リード・報酬・クリック履歴もすべて削除されます。\n削除するには協力者コード「${code}」を入力してください。`
    );
    if (input === null) return;
    if (input.trim() !== code) {
      setMessage("協力者コードが一致しないため削除を中止しました");
      return;
    }
    setDeleting(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/affiliates/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmCode: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "削除に失敗しました");
        return;
      }
      window.location.href = "/admin/affiliates";
    } finally {
      setDeleting(false);
    }
  };

  const load = useCallback(() => {
    fetch(`/api/admin/affiliates/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setDetail(data);
          setRewardLead(data.profile.rewardAmountLead?.toString() ?? "");
          setRewardConv(data.profile.rewardAmountConversion?.toString() ?? "");
        }
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!detail) {
    return <div className="py-12 text-center text-text-muted text-sm">読み込み中…</div>;
  }
  const p = detail.profile;

  const act = async (payload: Record<string, unknown>, msg: string) => {
    setMessage("");
    const res = await fetch(`/api/admin/affiliates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setMessage(res.ok ? msg : data.error || "操作に失敗しました");
    await load();
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(detail.lpUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded border border-gold/30 bg-gold/5 px-4 py-2.5 text-[13px] text-gold">{message}</div>
      )}

      {/* 基本情報 */}
      <section className="bg-bg-secondary border border-border rounded-md p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="font-mono text-[15px] text-gold">{p.affiliateCode}</span>
          <span className="text-[15px] text-text-primary font-medium">{p.user.name}</span>
          <span className="px-2 py-0.5 rounded text-[11px] border bg-gold/10 text-gold border-gold/20">
            {AFFILIATE_CHANNEL_LABELS[p.channel]}
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] border bg-status-active/10 text-status-active border-status-active/20">
            {AFFILIATE_STATUS_LABELS[p.status]}
          </span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setShowEdit(true)}
              className="px-3.5 py-1.5 rounded border border-border text-[12px] text-text-primary hover:border-gold"
            >
              編集
            </button>
            {p.status === "PENDING" && (
              <button
                onClick={() => setShowApprove(true)}
                className="px-3.5 py-1.5 rounded bg-gold/90 text-bg-primary text-[12px] font-bold hover:bg-gold"
              >
                承認する
              </button>
            )}
            {p.status === "ACTIVE" && (
              <button
                onClick={() => confirm("停止すると紹介URLが無効になります。よろしいですか？") && act({ action: "suspend" }, "停止しました")}
                className="px-3.5 py-1.5 rounded border border-status-warning/40 text-status-warning text-[12px] hover:bg-status-warning/10"
              >
                停止する
              </button>
            )}
            {p.status === "SUSPENDED" && (
              <button
                onClick={() => act({ action: "reactivate" }, "再開しました")}
                className="px-3.5 py-1.5 rounded bg-gold/90 text-bg-primary text-[12px] font-bold hover:bg-gold"
              >
                再開する
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-[13px]">
          <Row label="活動名" value={p.displayName || "---"} />
          <Row label="メール" value={p.user.email} />
          <Row label="電話番号" value={p.user.phone || "---"} />
          <Row label="登録日" value={new Date(p.createdAt).toLocaleDateString("ja-JP")} />
          <Row label="最終ログイン" value={p.user.lastLoginAt ? new Date(p.user.lastLoginAt).toLocaleString("ja-JP") : "---"} />
          <Row
            label="振込先"
            value={
              p.bankName
                ? `${p.bankName} ${p.bankBranch || ""} ${p.bankAccountType || ""} ${p.bankAccountNumber || ""} ${p.bankAccountName || ""}`
                : "未登録"
            }
          />
        </div>

        {/* 専用URL */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-[11px] text-text-muted mb-1.5">専用紹介URL</div>
          <div className="flex flex-wrap items-center gap-2">
            <code className="bg-bg-primary border border-border rounded px-3 py-2 text-[12px] text-gold break-all">
              {detail.lpUrl}
            </code>
            <button
              onClick={copyUrl}
              className="px-3 py-1.5 rounded border border-border text-[12px] text-text-primary hover:border-gold"
            >
              {copied ? "コピーしました ✓" : "コピー"}
            </button>
          </div>
        </div>
      </section>

      {/* 実績サマリー + 個別報酬設定 */}
      <section className="bg-bg-secondary border border-border rounded-md p-5">
        <div className="grid grid-cols-3 gap-4 mb-5">
          <Stat label="クリック" value={p._count.clicks} />
          <Stat label="リード" value={p.leads.length} />
          <Stat label="成約（第二報酬）" value={p.rewards.filter((r) => r.rewardType === "CONVERSION" && r.status !== "CANCELLED").length} />
        </div>

        <div className="border-t border-border pt-4">
          <div className="text-[12px] text-text-muted mb-2">
            個別報酬額（空欄の場合はチャネル既定額を適用）
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <div className="text-[11px] text-text-muted mb-1">第一報酬（円）</div>
              <input
                type="number"
                min={0}
                value={rewardLead}
                onChange={(e) => setRewardLead(e.target.value)}
                placeholder="既定"
                className="w-28 bg-bg-primary border border-border rounded px-2.5 py-1.5 text-[13px] text-text-primary text-right"
              />
            </div>
            <div>
              <div className="text-[11px] text-text-muted mb-1">第二報酬（円）</div>
              <input
                type="number"
                min={0}
                value={rewardConv}
                onChange={(e) => setRewardConv(e.target.value)}
                placeholder="既定"
                className="w-28 bg-bg-primary border border-border rounded px-2.5 py-1.5 text-[13px] text-text-primary text-right"
              />
            </div>
            <button
              onClick={() =>
                act(
                  { action: "setRewards", rewardAmountLead: rewardLead, rewardAmountConversion: rewardConv },
                  "個別報酬額を保存しました"
                )
              }
              className="px-4 py-1.5 rounded bg-gold/90 text-bg-primary text-[13px] font-bold hover:bg-gold"
            >
              保存
            </button>
          </div>
        </div>
      </section>

      {/* リード一覧 */}
      <section className="bg-bg-secondary border border-border rounded-md p-5">
        <h3 className="text-[14px] text-text-primary mb-3">このコード経由のリード（{p.leads.length}件）</h3>
        {p.leads.length === 0 ? (
          <p className="text-[13px] text-text-muted">リードはまだありません</p>
        ) : (
          <div className="divide-y divide-border">
            {p.leads.map((l) => (
              <div key={l.id} className="py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
                <span className="text-text-primary min-w-[110px]">{l.name}</span>
                <span className="text-[11px] text-text-muted">{LEAD_CALL_STATUS_LABELS[l.callStatus]}</span>
                {l.applicationId && <span className="text-[11px] text-status-active">申請済み</span>}
                {l.isDuplicate && <span className="text-[11px] text-status-warning">重複</span>}
                <span className="ml-auto text-[11px] text-text-muted">
                  {new Date(l.createdAt).toLocaleDateString("ja-JP")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 報酬履歴 */}
      <section className="bg-bg-secondary border border-border rounded-md p-5">
        <h3 className="text-[14px] text-text-primary mb-3">報酬履歴（{p.rewards.length}件）</h3>
        {p.rewards.length === 0 ? (
          <p className="text-[13px] text-text-muted">報酬はまだありません</p>
        ) : (
          <div className="divide-y divide-border">
            {p.rewards.map((r) => (
              <div key={r.id} className="py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
                <span className="text-text-primary">{AFFILIATE_REWARD_TYPE_LABELS[r.rewardType]}</span>
                {r.memberName && <span className="text-[11px] text-text-muted">{r.memberName}</span>}
                <span className="text-gold">¥{r.rewardAmount.toLocaleString()}</span>
                <span className="text-[11px] text-text-muted">{AFFILIATE_REWARD_STATUS_LABELS[r.status]}</span>
                <span className="ml-auto text-[11px] text-text-muted">
                  {new Date(r.createdAt).toLocaleDateString("ja-JP")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 危険操作: 削除 */}
      <section className="bg-bg-secondary border border-red-400/20 rounded-md p-5">
        <h3 className="text-[14px] text-red-400 mb-2">協力者の削除</h3>
        <p className="text-[12px] text-text-muted mb-3 leading-relaxed">
          この協力者と、紐づくリード・報酬・クリック履歴をすべて削除します。この操作は取り消せません。
        </p>
        <button
          onClick={() => handleDelete(p.affiliateCode)}
          disabled={deleting}
          className="px-4 py-1.5 rounded border border-red-400/40 text-red-400 text-[13px] hover:bg-red-400/10 disabled:opacity-50"
        >
          {deleting ? "削除中…" : "この協力者を削除する"}
        </button>
      </section>

      {/* 編集モーダル（基本情報・チャネル・口座） */}
      {showEdit && (
        <EditModal
          initial={{
            name: p.user.name,
            email: p.user.email,
            phone: p.user.phone || "",
            displayName: p.displayName || "",
            channel: p.channel,
            bankName: p.bankName || "",
            bankBranch: p.bankBranch || "",
            bankAccountType: p.bankAccountType || "",
            bankAccountNumber: p.bankAccountNumber || "",
            bankAccountName: p.bankAccountName || "",
          }}
          onSubmit={async (values) => {
            const res = await fetch(`/api/admin/affiliates/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "updateInfo", ...values }),
            });
            const data = await res.json();
            if (!res.ok) return data.error || "更新に失敗しました";
            setMessage("協力者情報を更新しました");
            load();
            return null;
          }}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* 承認モーダル（ログインID・パスワードを管理者が指定） */}
      {showApprove && (
        <ApproveModal
          targetName={p.user.name}
          initialLoginId={p.user.loginId}
          onSubmit={async (loginId, password) => {
            const res = await fetch(`/api/admin/affiliates/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "approve", loginId, password }),
            });
            const data = await res.json();
            if (!res.ok) return data.error || "承認に失敗しました";
            setMessage(`承認し、ログイン情報（ID: ${data.loginId}）をメールで送付しました`);
            load();
            return null;
          }}
          onClose={() => setShowApprove(false)}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-text-muted shrink-0 w-[90px]">{label}</span>
      <span className="text-text-primary break-all">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-bg-primary border border-border rounded p-3 text-center">
      <div className="text-[11px] text-text-muted mb-1">{label}</div>
      <div className="text-[20px] text-text-primary font-medium">{value.toLocaleString()}</div>
    </div>
  );
}

// 編集モーダル（基本情報・チャネル・口座情報）
type EditValues = {
  name: string;
  email: string;
  phone: string;
  displayName: string;
  channel: string;
  bankName: string;
  bankBranch: string;
  bankAccountType: string;
  bankAccountNumber: string;
  bankAccountName: string;
};

function EditModal({
  initial,
  onSubmit,
  onClose,
}: {
  initial: EditValues;
  onSubmit: (values: EditValues) => Promise<string | null>; // 戻り値: エラーメッセージ(成功時null)
  onClose: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof EditValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = async () => {
    if (!values.name.trim() || !values.email.trim()) {
      setError("氏名とメールアドレスは必須です");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const err = await onSubmit(values);
      if (err) {
        setError(err);
        return;
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const input = "w-full bg-bg-primary border border-border rounded px-3 py-2 text-[13px] text-text-primary";
  const label = "text-[11px] text-text-muted mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-md border border-border bg-bg-secondary p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[15px] text-text-primary mb-4">協力者情報の編集</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <span className={label}>氏名 *</span>
            <input value={values.name} onChange={set("name")} className={input} />
          </div>
          <div>
            <span className={label}>活動名</span>
            <input value={values.displayName} onChange={set("displayName")} className={input} />
          </div>
          <div>
            <span className={label}>メールアドレス *</span>
            <input type="email" value={values.email} onChange={set("email")} className={input} />
          </div>
          <div>
            <span className={label}>電話番号</span>
            <input value={values.phone} onChange={set("phone")} className={input} />
          </div>
          <div>
            <span className={label}>チャネル</span>
            <select value={values.channel} onChange={set("channel")} className={input}>
              <option value="NW">人脈繋がり</option>
              <option value="KAWARA">KAWARA版</option>
            </select>
          </div>
        </div>

        <div className="border-t border-border pt-3 mb-4">
          <div className="text-[12px] text-text-muted mb-2">振込先口座</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className={label}>銀行名</span>
              <input value={values.bankName} onChange={set("bankName")} className={input} />
            </div>
            <div>
              <span className={label}>支店名</span>
              <input value={values.bankBranch} onChange={set("bankBranch")} className={input} />
            </div>
            <div>
              <span className={label}>口座種別</span>
              <select value={values.bankAccountType} onChange={set("bankAccountType")} className={input}>
                <option value="">未設定</option>
                <option value="普通">普通</option>
                <option value="当座">当座</option>
              </select>
            </div>
            <div>
              <span className={label}>口座番号</span>
              <input value={values.bankAccountNumber} onChange={set("bankAccountNumber")} className={input} />
            </div>
            <div className="sm:col-span-2">
              <span className={label}>口座名義（カナ）</span>
              <input value={values.bankAccountName} onChange={set("bankAccountName")} className={input} />
            </div>
          </div>
        </div>

        {error && (
          <p className="mb-3 rounded border border-red-400/30 bg-red-400/10 px-3 py-2 text-[12px] text-red-400">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded border border-border text-[13px] text-text-primary hover:border-gold disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="px-4 py-2 rounded bg-gold/90 text-bg-primary text-[13px] font-bold hover:bg-gold disabled:opacity-50"
          >
            {submitting ? "保存中…" : "保存する"}
          </button>
        </div>
      </div>
    </div>
  );
}
