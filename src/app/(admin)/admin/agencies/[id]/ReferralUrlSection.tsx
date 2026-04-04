"use client";

import { useState, useEffect } from "react";

type StaffItem = { id: string; staffCode: string; name: string };

export default function ReferralUrlSection({ agencyCode }: { agencyCode: string }) {
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  // 代理店用URL
  const agencyUrl = `${baseUrl}/form/app?ref=${agencyCode}`;

  // 従業員付きURL
  const staffUrl = selectedStaff
    ? `${baseUrl}/form/app?ref=${agencyCode}&staff=${selectedStaff}`
    : "";

  // アクティブ従業員リストを取得
  useEffect(() => {
    fetch("/api/admin/staff")
      .then((r) => r.json())
      .then((data) => {
        const active = (data as StaffItem[]).filter((s: StaffItem & { isActive?: boolean }) => s.isActive !== false);
        setStaffList(active);
      })
      .catch(() => {});
  }, []);

  const handleCopy = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!agencyCode) return null;

  return (
    <div className="mt-6 bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
      <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
        紹介URL発行
      </h3>

      {/* 代理店用URL */}
      <div className="mb-5">
        <label className="block text-[11px] text-text-muted mb-2">代理店紹介URL</label>
        <div className="flex gap-2">
          <input value={agencyUrl} readOnly className="flex-1 px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-[12px] text-text-secondary font-mono outline-none" />
          <button
            onClick={() => handleCopy(agencyUrl, "agency")}
            className="px-4 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[12px] font-semibold cursor-pointer hover:opacity-90 transition-all shrink-0"
          >
            {copied === "agency" ? "✓ コピー済" : "コピー"}
          </button>
        </div>
        <p className="text-[10px] text-text-muted mt-1.5">
          このURLから申込があった場合、自動的にこの代理店に紐付けされます
        </p>
      </div>

      {/* 担当従業員付きURL */}
      <div className="border-t border-border pt-5">
        <label className="block text-[11px] text-text-muted mb-2">担当従業員付きURL</label>
        <div className="flex gap-2 mb-2">
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="flex-1 px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none cursor-pointer focus:border-border-gold"
          >
            <option value="">従業員を選択</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.staffCode}>
                {s.staffCode} — {s.name}
              </option>
            ))}
          </select>
        </div>
        {staffUrl && (
          <div className="flex gap-2 mt-2">
            <input value={staffUrl} readOnly className="flex-1 px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-[12px] text-text-secondary font-mono outline-none" />
            <button
              onClick={() => handleCopy(staffUrl, "staff")}
              className="px-4 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[12px] font-semibold cursor-pointer hover:opacity-90 transition-all shrink-0"
            >
              {copied === "staff" ? "✓ コピー済" : "コピー"}
            </button>
          </div>
        )}
        <p className="text-[10px] text-text-muted mt-1.5">
          従業員を選択すると、代理店と従業員の両方に紐付けされるURLが生成されます
        </p>
      </div>
    </div>
  );
}
