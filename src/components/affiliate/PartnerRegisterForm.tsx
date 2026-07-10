"use client";

import { useState } from "react";

// 紹介協力者のセルフ登録フォーム（チャネル別ページから利用）
export default function PartnerRegisterForm({ channel }: { channel: "NW" | "KAWARA" }) {
  const [form, setForm] = useState({
    name: "",
    nameKana: "",
    email: "",
    phone: "",
    displayName: "",
    website: "", // honeypot
  });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"" | "pending" | "active">("");
  const [error, setError] = useState("");

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/partner/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, channel, hasAgreedTerms: agreed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "登録に失敗しました。時間をおいて再度お試しください。");
        return;
      }
      setResult(data.pending ? "pending" : "active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="mt-10 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <h2 className="text-xl font-bold">ご登録を受け付けました</h2>
        <p className="mt-4 text-sm leading-relaxed text-gray-600">
          {result === "pending" ? (
            <>
              事務局にて登録内容を確認のうえ、
              <br />
              ログイン情報とご紹介用URLをメールでお送りします。
              <br />
              今しばらくお待ちください。
            </>
          ) : (
            <>
              ログイン情報とご紹介用URLをメールでお送りしました。
              <br />
              メールをご確認のうえ、専用ページにログインしてください。
            </>
          )}
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-[15px] focus:border-gray-800 focus:outline-none";
  const labelClass = "mb-1.5 block text-sm font-bold";
  const required = <span className="ml-1 text-xs font-normal text-red-600">必須</span>;

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label className={labelClass} htmlFor="pr-name">お名前{required}</label>
        <input id="pr-name" type="text" value={form.name} onChange={set("name")}
          placeholder="山田 太郎" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="pr-kana">フリガナ{required}</label>
        <input id="pr-kana" type="text" value={form.nameKana} onChange={set("nameKana")}
          placeholder="ヤマダ タロウ" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="pr-email">メールアドレス{required}</label>
        <input id="pr-email" type="email" value={form.email} onChange={set("email")}
          placeholder="example@mail.com" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="pr-phone">お電話番号{required}</label>
        <input id="pr-phone" type="tel" value={form.phone} onChange={set("phone")}
          placeholder="09012345678" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="pr-display">活動名（任意）</label>
        <input id="pr-display" type="text" value={form.displayName} onChange={set("displayName")}
          placeholder="SNSアカウント名・サイト名など" className={inputClass} />
      </div>
      {/* honeypot */}
      <input
        type="text"
        value={form.website}
        onChange={set("website")}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", height: 0, width: 0, opacity: 0 }}
      />
      <label className="flex items-start gap-2.5 rounded-md border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm leading-relaxed">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          required
          className="mt-0.5 h-4 w-4"
        />
        <span>
          紹介協力制度の規約および個人情報の取扱いに同意します。
          <br />
          <span className="text-xs text-gray-500">
            ご紹介実績の管理・報酬のお支払いのために、ご入力情報を利用します。
          </span>
        </span>
      </label>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      <button
        type="submit"
        disabled={submitting || !agreed}
        className="w-full rounded-md bg-gray-900 py-3.5 text-base font-bold text-white transition hover:bg-gray-700 disabled:opacity-50"
      >
        {submitting ? "送信中…" : "紹介協力制度に登録する"}
      </button>
    </form>
  );
}
