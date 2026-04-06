"use client";

import { useState, useEffect } from "react";

interface Setting {
  id: string;
  key: string;
  title: string;
  content: string;
  updatedBy: string | null;
  updatedAt: string;
}

const SETTING_KEYS = [
  { key: "important_notice", label: "重要事項説明書兼確認書" },
  { key: "privacy_consent", label: "個人情報同意書" },
  { key: "terms", label: "BioVault会員規約" },
  { key: "legal", label: "特定商取引法に基づく表記" },
  { key: "privacy_policy", label: "プライバシーポリシー" },
  { key: "pamphlet_url", label: "パンフレットURL" },
];

// 6書類の定義
const DOC_CONFIGS = [
  { key: "contract", label: "001 重要事項説明書兼確認書", timing: "初ログイン時" },
  { key: "privacy", label: "002 個人情報同意書", timing: "初ログイン時" },
  { key: "membership_contract", label: "003 メンバーシップ契約書", timing: "サービス申込時" },
  { key: "cell_consent", label: "004 細胞提供・保管同意書", timing: "日程調整前" },
  { key: "informed_consent", label: "005 iPS細胞作製における事前説明・同意", timing: "問診・採血前" },
  { key: "pamphlet", label: "006 パンフレット免責事項", timing: "パンフレット閲覧時" },
];

const DOC_FIELDS = [
  { suffix: "title", label: "文書タイトル", type: "text" as const },
  { suffix: "subtitle", label: "タイトル直下の説明文", type: "text" as const },
  { suffix: "content", label: "本文", type: "textarea" as const },
  { suffix: "button", label: "ボタン文言", type: "text" as const },
  { suffix: "thanks", label: "サンクスページの文言", type: "textarea" as const },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => { setSettings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const startEdit = (key: string) => {
    const existing = settings.find((s) => s.key === key);
    const label = SETTING_KEYS.find((k) => k.key === key)?.label || key;
    setEditTitle(existing?.title || label);
    setEditContent(existing?.content || "");
    setEditingKey(key);
    setMessage("");
  };

  const handleSave = async () => {
    if (!editingKey) return;
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: editingKey, title: editTitle, content: editContent }),
    });

    if (res.ok) {
      setMessage("保存しました");
      setEditingKey(null);
      // リフレッシュ
      const data = await (await fetch("/api/admin/settings")).json();
      setSettings(data);
    }
    setSaving(false);
  };

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        規約・書類管理
      </h2>

      {message && (
        <div className="mb-4 p-3 bg-status-active/10 border border-status-active/20 rounded text-status-active text-xs">
          {message}
        </div>
      )}

      {editingKey ? (
        <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-7">
          <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">
            {SETTING_KEYS.find((k) => k.key === editingKey)?.label} を編集
          </h3>

          <div className="mb-4">
            <label className="block text-xs text-text-secondary mb-2">タイトル</label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none focus:border-border-gold"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs text-text-secondary mb-2">
              内容 <span className="text-text-muted">（HTML可。段落は &lt;p&gt; タグで囲んでください）</span>
            </label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={20}
              className="w-full px-4 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-xs outline-none resize-y font-mono leading-relaxed focus:border-border-gold"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存"}
            </button>
            <button
              onClick={() => setEditingKey(null)}
              className="px-5 py-2.5 border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold transition-all"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
          {SETTING_KEYS.map((item) => {
            const setting = settings.find((s) => s.key === item.key);
            return (
              <div
                key={item.key}
                className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border last:border-b-0 hover:bg-bg-elevated transition-colors"
              >
                <div>
                  <div className="text-sm text-text-primary">{item.label}</div>
                  {setting ? (
                    <div className="text-[11px] text-text-muted mt-0.5">
                      最終更新: {new Date(setting.updatedAt).toLocaleDateString("ja-JP")}
                      {setting.updatedBy && ` (${setting.updatedBy})`}
                    </div>
                  ) : (
                    <div className="text-[11px] text-text-muted mt-0.5">未設定（デフォルト表示）</div>
                  )}
                </div>
                <button
                  onClick={() => startEdit(item.key)}
                  className="px-3 py-1.5 bg-transparent border border-border text-text-secondary rounded-sm text-[11px] hover:border-border-gold hover:text-gold transition-all cursor-pointer"
                >
                  編集
                </button>
              </div>
            );
          })}
          {loading && (
            <div className="px-6 py-8 text-center text-text-muted text-sm">読み込み中...</div>
          )}
        </div>
      )}

      {/* 契約書類の編集 */}
      <div className="mt-10">
        <h3 className="font-serif-jp text-base font-normal text-text-primary tracking-wider mb-4 pb-3 border-b border-border">
          契約書類の編集
        </h3>
        <p className="text-xs text-text-muted mb-5">マイページの「契約・同意事項書類一覧」に表示される各書類の内容を編集します。</p>

        <div className="space-y-3">
          {DOC_CONFIGS.map((doc) => {
            const isOpen = editingKey === `doc_${doc.key}`;
            const hasContent = DOC_FIELDS.some((f) => {
              const s = settings.find((st) => st.key === `doc_${doc.key}_${f.suffix}`);
              return s && s.content;
            });

            return (
              <div key={doc.key} className="bg-bg-secondary border border-border rounded-md overflow-hidden">
                <button
                  onClick={() => {
                    if (isOpen) {
                      setEditingKey(null);
                    } else {
                      setEditingKey(`doc_${doc.key}`);
                    }
                  }}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-bg-elevated transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 text-left">
                    <span className={`text-sm font-medium ${hasContent ? "text-gold" : "text-text-primary"}`}>{doc.label}</span>
                    <span className="text-[10px] text-text-muted">{doc.timing}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasContent && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-active/10 text-status-active border border-status-active/20">編集済</span>
                    )}
                    <span className={`text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 border-t border-border pt-4">
                    <div className="space-y-4">
                      {DOC_FIELDS.map((field) => {
                        const settingKey = `doc_${doc.key}_${field.suffix}`;
                        const existing = settings.find((s) => s.key === settingKey);
                        return (
                          <div key={field.suffix}>
                            <label className="block text-[11px] text-text-muted mb-1">{field.label}</label>
                            {field.type === "text" ? (
                              <input
                                defaultValue={existing?.content || ""}
                                id={settingKey}
                                className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold"
                              />
                            ) : (
                              <textarea
                                defaultValue={existing?.content || ""}
                                id={settingKey}
                                rows={field.suffix === "content" ? 10 : 3}
                                className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold resize-y"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => setEditingKey(null)}
                        className="px-4 py-2 bg-transparent border border-border text-text-secondary rounded-sm text-xs cursor-pointer hover:border-border-gold transition-all"
                      >
                        閉じる
                      </button>
                      <button
                        onClick={async () => {
                          setSaving(true);
                          setMessage("");
                          for (const field of DOC_FIELDS) {
                            const settingKey = `doc_${doc.key}_${field.suffix}`;
                            const el = document.getElementById(settingKey) as HTMLInputElement | HTMLTextAreaElement;
                            const content = el?.value || "";
                            await fetch("/api/admin/settings", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ key: settingKey, title: `${doc.key}_${field.suffix}`, content }),
                            });
                          }
                          setMessage("保存しました");
                          const data = await (await fetch("/api/admin/settings")).json();
                          setSettings(data);
                          setSaving(false);
                          setTimeout(() => setMessage(""), 3000);
                        }}
                        disabled={saving}
                        className="px-4 py-2 bg-gold-gradient border-none rounded-sm text-bg-primary text-xs font-semibold cursor-pointer hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        {saving ? "保存中..." : "保存する"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
