"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 6書類の定義
const DOC_CONFIGS = [
  { key: "contract", label: "001 重要事項説明書兼確認書", timing: "初ログイン時" },
  { key: "privacy", label: "002 個人情報同意書", timing: "初ログイン時" },
  { key: "membership_contract", label: "003 メンバーシップ契約書", timing: "サービス申込時" },
  { key: "cell_consent", label: "004 細胞提供・保管同意書", timing: "日程調整前" },
  { key: "informed_consent", label: "005 iPS細胞作製における事前説明・同意", timing: "問診・採血前" },
  { key: "pamphlet", label: "006 パンフレット免責事項", timing: "パンフレット閲覧時" },
];

// フィールドの定義
const FIELDS = [
  { suffix: "title", label: "文書タイトル", type: "text" as const, placeholder: "例: BioVault 重要事項説明書兼確認書" },
  { suffix: "subtitle", label: "タイトル直下の説明文", type: "text" as const, placeholder: "例: サービスのご利用にあたり..." },
  { suffix: "content", label: "本文", type: "textarea" as const, placeholder: "本文をここに入力..." },
  { suffix: "button", label: "ボタン文言", type: "text" as const, placeholder: "例: 同意する" },
  { suffix: "thanks", label: "サンクスページの文言", type: "textarea" as const, placeholder: "例: ご同意ありがとうございます..." },
];

interface Props {
  initialSettings: Record<string, string>;
}

export default function DocSettingsEditor({ initialSettings }: Props) {
  const router = useRouter();
  const [openDoc, setOpenDoc] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const getValue = (docKey: string, suffix: string) => values[`doc_${docKey}_${suffix}`] || "";

  const setValue = (docKey: string, suffix: string, val: string) => {
    setValues((prev) => ({ ...prev, [`doc_${docKey}_${suffix}`]: val }));
  };

  const handleSave = async (docKey: string) => {
    setSaving(true);
    setMessage("");
    try {
      // 各フィールドを個別に保存
      for (const field of FIELDS) {
        const key = `doc_${docKey}_${field.suffix}`;
        const content = values[key] || "";
        await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, title: `${docKey}_${field.suffix}`, content }),
        });
      }
      setMessage(`保存しました`);
      router.refresh();
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="font-serif-jp text-base font-normal text-text-primary tracking-wider mb-4 pb-3 border-b border-border">
        契約書類の編集
      </h3>
      <p className="text-xs text-text-muted mb-5">マイページの「契約・同意事項書類一覧」に表示される各書類の内容を編集します。</p>

      {message && (
        <div className="mb-4 p-2 bg-status-active/10 border border-status-active/20 rounded text-status-active text-[11px]">
          {message}
        </div>
      )}

      <div className="space-y-3">
        {DOC_CONFIGS.map((doc) => {
          const isOpen = openDoc === doc.key;
          const hasContent = FIELDS.some((f) => getValue(doc.key, f.suffix));

          return (
            <div key={doc.key} className="bg-bg-secondary border border-border rounded-md overflow-hidden">
              {/* ヘッダー */}
              <button
                onClick={() => setOpenDoc(isOpen ? null : doc.key)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-bg-elevated transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${hasContent ? "text-gold" : "text-text-primary"}`}>
                    {doc.label}
                  </span>
                  <span className="text-[10px] text-text-muted">{doc.timing}</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasContent && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-active/10 text-status-active border border-status-active/20">編集済</span>
                  )}
                  <span className={`text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
                </div>
              </button>

              {/* 編集フォーム */}
              {isOpen && (
                <div className="px-5 pb-5 border-t border-border pt-4">
                  <div className="space-y-4">
                    {FIELDS.map((field) => (
                      <div key={field.suffix}>
                        <label className="block text-[11px] text-text-muted mb-1">{field.label}</label>
                        {field.type === "text" ? (
                          <input
                            value={getValue(doc.key, field.suffix)}
                            onChange={(e) => setValue(doc.key, field.suffix, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold"
                          />
                        ) : (
                          <textarea
                            value={getValue(doc.key, field.suffix)}
                            onChange={(e) => setValue(doc.key, field.suffix, e.target.value)}
                            placeholder={field.placeholder}
                            rows={field.suffix === "content" ? 10 : 3}
                            className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold resize-y"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setOpenDoc(null)}
                      className="px-4 py-2 bg-transparent border border-border text-text-secondary rounded-sm text-xs cursor-pointer hover:border-border-gold transition-all"
                    >
                      閉じる
                    </button>
                    <button
                      onClick={() => handleSave(doc.key)}
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
  );
}
