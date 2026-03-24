"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  initialEmail: string;
  initialPhone: string;
  initialDateOfBirth: string;
  initialAddress: string;
}

export default function ProfileEditableFields({
  userId,
  initialEmail,
  initialPhone,
  initialDateOfBirth,
  initialAddress,
}: Props) {
  const router = useRouter();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [values, setValues] = useState({
    email: initialEmail,
    phone: initialPhone,
    dateOfBirth: initialDateOfBirth,
    address: initialAddress,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fields = [
    { key: "email", label: "メールアドレス", type: "email", placeholder: "your@email.com" },
    { key: "phone", label: "電話番号", type: "tel", placeholder: "090-0000-0000" },
    { key: "dateOfBirth", label: "生年月日", type: "date", placeholder: "" },
    { key: "address", label: "住所", type: "text", placeholder: "東京都港区..." },
  ] as const;

  const handleSave = async (field: string) => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/member/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: values[field as keyof typeof values] }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "更新に失敗しました");
      } else {
        setMessage("更新しました");
        setEditingField(null);
        router.refresh();
        setTimeout(() => setMessage(""), 2000);
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (field: string) => {
    // 元の値に戻す
    setValues((prev) => ({
      ...prev,
      [field]: field === "email" ? initialEmail :
               field === "phone" ? initialPhone :
               field === "dateOfBirth" ? initialDateOfBirth :
               initialAddress,
    }));
    setEditingField(null);
    setError("");
  };

  const formatDisplay = (key: string, value: string) => {
    if (!value) return "---";
    if (key === "dateOfBirth") {
      return new Date(value).toLocaleDateString("ja-JP");
    }
    return value;
  };

  return (
    <div>
      {message && (
        <div className="mb-3 p-2 bg-status-active/10 border border-status-active/20 rounded text-status-active text-[11px] text-center">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-3 p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-[11px] text-center">
          {error}
        </div>
      )}

      <div className="border-t border-border">
        {fields.map((field) => {
          const isEditing = editingField === field.key;
          const value = values[field.key as keyof typeof values];

          return (
            <div key={field.key} className="flex items-center py-3 border-b border-border">
              <div className="w-28 sm:w-32 text-[11px] text-text-muted shrink-0">{field.label}</div>
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type={field.type}
                      value={value}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      className="flex-1 min-w-0 px-3 py-1.5 bg-bg-elevated border border-border-gold rounded-sm text-text-primary text-[13px] outline-none"
                    />
                    <button
                      onClick={() => handleSave(field.key)}
                      disabled={saving}
                      className="px-2.5 py-1.5 bg-gold-gradient text-bg-primary text-[11px] font-semibold rounded-sm shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {saving ? "..." : "保存"}
                    </button>
                    <button
                      onClick={() => handleCancel(field.key)}
                      className="px-2 py-1.5 text-text-muted text-[11px] hover:text-text-secondary transition-colors shrink-0 cursor-pointer"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] text-text-primary truncate">
                      {formatDisplay(field.key, value)}
                    </span>
                    <button
                      onClick={() => {
                        setEditingField(field.key);
                        setError("");
                      }}
                      className="text-[11px] text-text-muted hover:text-gold transition-colors shrink-0 cursor-pointer"
                      title="編集"
                    >
                      ✎
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
