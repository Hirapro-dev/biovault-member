"use client";

// 紹介協力制度の設定パネル（自動承認トグル + チャネル別デフォルト報酬額 + 登録フォームURL）
import { useEffect, useState } from "react";

type Settings = {
  autoApprove: boolean;
  rewardLead: { NW: number; KAWARA: number };
  rewardConversion: { NW: number; KAWARA: number };
};

export default function AffiliateSettingsPanel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/affiliate-settings")
      .then((r) => r.json())
      .then((d) => d.settings && setSettings(d.settings))
      .catch(() => {});
  }, []);

  if (!settings) return null;

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/affiliate-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoApprove: settings.autoApprove,
          rewardLeadNw: settings.rewardLead.NW,
          rewardLeadKawara: settings.rewardLead.KAWARA,
          rewardConversionNw: settings.rewardConversion.NW,
          rewardConversionKawara: settings.rewardConversion.KAWARA,
        }),
      });
      const data = await res.json();
      setMessage(res.ok ? "設定を保存しました" : data.error || "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const amountInput = (
    value: number,
    onChange: (n: number) => void
  ) => (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => onChange(Math.max(0, parseInt(e.target.value || "0", 10)))}
      className="w-28 bg-bg-secondary border border-border rounded px-2.5 py-1.5 text-[13px] text-text-primary text-right"
    />
  );

  return (
    <details className="bg-bg-secondary border border-border rounded-md mb-6">
      <summary className="px-4 py-3 text-[13px] text-text-primary cursor-pointer select-none">
        制度設定（承認モード・デフォルト報酬額）
      </summary>
      <div className="px-4 pb-4 pt-1 border-t border-border">
        {/* 承認モード */}
        <div className="flex items-center gap-3 py-3">
          <span className="text-[13px] text-text-muted w-40">協力者登録の承認</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoApprove}
              onChange={(e) => setSettings({ ...settings, autoApprove: e.target.checked })}
              className="h-4 w-4"
            />
            <span className="text-[13px] text-text-primary">
              {settings.autoApprove ? "自動承認（登録後すぐURL発行）" : "手動承認（管理者が承認後にURL発行）"}
            </span>
          </label>
        </div>

        {/* デフォルト報酬額 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 py-3 border-t border-border">
          <div>
            <div className="text-[12px] text-text-muted mb-2">第一報酬（リード獲得・1件あたり）</div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[13px] text-text-primary w-24">人脈繋がり</span>
              {amountInput(settings.rewardLead.NW, (n) =>
                setSettings({ ...settings, rewardLead: { ...settings.rewardLead, NW: n } })
              )}
              <span className="text-[13px] text-text-muted">円</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-text-primary w-24">KAWARA版</span>
              {amountInput(settings.rewardLead.KAWARA, (n) =>
                setSettings({ ...settings, rewardLead: { ...settings.rewardLead, KAWARA: n } })
              )}
              <span className="text-[13px] text-text-muted">円</span>
            </div>
          </div>
          <div>
            <div className="text-[12px] text-text-muted mb-2">第二報酬（本登録・1件あたり）</div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[13px] text-text-primary w-24">人脈繋がり</span>
              {amountInput(settings.rewardConversion.NW, (n) =>
                setSettings({ ...settings, rewardConversion: { ...settings.rewardConversion, NW: n } })
              )}
              <span className="text-[13px] text-text-muted">円</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-text-primary w-24">KAWARA版</span>
              {amountInput(settings.rewardConversion.KAWARA, (n) =>
                setSettings({ ...settings, rewardConversion: { ...settings.rewardConversion, KAWARA: n } })
              )}
              <span className="text-[13px] text-text-muted">円</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-text-muted mb-3">
          ※ 金額は起票時点の値が適用されます（変更しても過去の報酬は変わりません）。協力者ごとの個別金額は各協力者の詳細ページで設定できます。
        </p>

        {message && <p className="text-[12px] text-gold mb-2">{message}</p>}
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-1.5 rounded bg-gold/90 text-bg-primary text-[13px] font-bold hover:bg-gold transition-colors disabled:opacity-50"
        >
          {saving ? "保存中…" : "設定を保存"}
        </button>

        {/* 協力者登録フォームURL（チャネル別・コピー用） */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-[12px] text-text-muted mb-2">協力者登録フォームURL（紹介協力者に案内するURL）</div>
          <RegisterUrlRow label="人脈繋がり" path="/partner/register/nw" />
          <RegisterUrlRow label="KAWARA版" path="/partner/register/kawara" />
        </div>
      </div>
    </details>
  );
}

// 登録フォームURLの表示 + コピー行
function RegisterUrlRow({ label, path }: { label: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState(path);

  // 環境（プレビュー/本番）に応じたフルURLをクライアント側で組み立てる
  useEffect(() => {
    setUrl(`${window.location.origin}${path}`);
  }, [path]);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-2">
      <span className="text-[13px] text-text-primary w-24 shrink-0">{label}</span>
      <code className="flex-1 min-w-[220px] bg-bg-primary border border-border rounded px-2.5 py-1.5 text-[12px] text-gold break-all">
        {url}
      </code>
      <button
        onClick={copy}
        className="px-3 py-1.5 rounded border border-border text-[12px] text-text-primary hover:border-gold transition-colors"
      >
        {copied ? "コピーしました ✓" : "コピー"}
      </button>
    </div>
  );
}
