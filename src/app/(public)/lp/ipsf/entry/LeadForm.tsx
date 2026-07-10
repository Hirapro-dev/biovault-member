"use client";

import { useState } from "react";
import { INCOME_OPTIONS } from "@/lib/affiliate-labels";

// リード登録フォーム（LP経由の見込み顧客）
export default function LeadForm({ refCode }: { refCode: string }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    occupation: "",
    position: "",
    income: "",
    website: "", // honeypot（画面には表示しない）
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/lp/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ref: refCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "登録に失敗しました。時間をおいて再度お試しください。");
        return;
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mt-10 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <h2 className="text-xl font-bold">お申込みを受け付けました</h2>
        <p className="mt-4 text-sm leading-relaxed text-gray-600">
          ご登録ありがとうございます。
          <br />
          担当者より順次お電話にてご連絡いたしますので、今しばらくお待ちください。
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
        <label className={labelClass} htmlFor="lead-name">お名前{required}</label>
        <input id="lead-name" type="text" value={form.name} onChange={set("name")}
          placeholder="山田 太郎" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="lead-email">メールアドレス{required}</label>
        <input id="lead-email" type="email" value={form.email} onChange={set("email")}
          placeholder="example@mail.com" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="lead-address">ご住所{required}</label>
        <input id="lead-address" type="text" value={form.address} onChange={set("address")}
          placeholder="東京都〇〇区〇〇 1-2-3" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="lead-phone">お電話番号{required}</label>
        <input id="lead-phone" type="tel" value={form.phone} onChange={set("phone")}
          placeholder="09012345678" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="lead-occupation">ご職業</label>
        <input id="lead-occupation" type="text" value={form.occupation} onChange={set("occupation")}
          placeholder="会社経営" className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="lead-position">役職</label>
        <input id="lead-position" type="text" value={form.position} onChange={set("position")}
          placeholder="代表取締役" className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="lead-income">ご年収</label>
        <select id="lead-income" value={form.income} onChange={set("income")} className={inputClass}>
          <option value="">選択してください</option>
          {INCOME_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      {/* honeypot: botのみが入力する不可視フィールド */}
      <input
        type="text"
        value={form.website}
        onChange={set("website")}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", height: 0, width: 0, opacity: 0 }}
      />
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-gray-900 py-3.5 text-base font-bold text-white transition hover:bg-gray-700 disabled:opacity-50"
      >
        {submitting ? "送信中…" : "無料適合確認に申し込む"}
      </button>
    </form>
  );
}
