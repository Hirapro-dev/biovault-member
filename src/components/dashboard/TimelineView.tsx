"use client";

import { useState } from "react";
import Link from "next/link";

type Member = {
  userId: string;
  name: string;
  memberNumber: string;
  contractDate?: string | null;
  statusChangedAt?: string | null;
  clinicDate?: string | null;
  clinicName?: string | null;
  planLabel?: string;
  totalAmount?: number;
};

type Step = {
  key: string;
  label: string;
  icon: string;
  actor?: "admin" | "member";
  members: Member[];
};

interface Props {
  steps: Step[];
  hrefPrefix: string; // "/admin/members" | "/staff/members" | "/agency/customers"
}

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "---";
  return new Date(d).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
};

export default function TimelineView({ steps, hrefPrefix }: Props) {
  const [openStep, setOpenStep] = useState<string | null>(null);

  return (
    <div className="relative">
      {steps.map((step, i) => {
        const count = step.members.length;
        const isOpen = openStep === step.key;
        const isLast = i === steps.length - 1;
        const hasMembers = count > 0;

        return (
          <div key={step.key} className={isLast ? "" : "pb-1"}>
            {/* ステップヘッダー */}
            <div
              onClick={() => hasMembers && setOpenStep(isOpen ? null : step.key)}
              className={`flex items-center gap-3 py-3 px-3 rounded-lg transition-all ${
                hasMembers ? "cursor-pointer hover:bg-bg-elevated" : ""
              } ${isOpen ? "bg-bg-elevated" : ""}`}
            >
              {/* タイムラインノード */}
              <div className="relative">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 ${
                    hasMembers ? "border-2 border-gold" : "border border-border"
                  }`}
                  style={{
                    background: hasMembers ? "rgba(191,160,75,0.1)" : "var(--color-bg-elevated)",
                  }}
                >
                  {step.icon}
                </div>
                {/* 接続線 */}
                {!isLast && (
                  <div
                    className="absolute left-1/2 top-full w-[2px] h-4 -translate-x-1/2"
                    style={{ background: "var(--color-border)" }}
                  />
                )}
              </div>

              {/* ラベル + actor バッジ */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[13px] ${hasMembers ? "text-text-primary" : "text-text-muted"}`}>
                    {step.label}
                  </span>
                  {step.actor && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${
                      step.actor === "admin"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}>
                      {step.actor === "admin" ? "管理者対応" : "会員操作待ち"}
                    </span>
                  )}
                </div>
              </div>

              {/* 人数バッジ */}
              <div className={`text-xs px-2.5 py-1 rounded-full font-mono shrink-0 ${
                hasMembers
                  ? "bg-gold/15 text-gold border border-gold/20 font-bold"
                  : "bg-bg-elevated text-text-muted border border-border"
              }`}>
                {count}
              </div>

              {/* 展開矢印 */}
              {hasMembers && (
                <div className={`text-text-muted text-xs transition-transform ${isOpen ? "rotate-90" : ""}`}>
                  ▶
                </div>
              )}
            </div>

            {/* 会員一覧（展開時） */}
            {isOpen && (
              <div className="ml-12 mb-3 space-y-1">
                {step.members.map((m, idx) => (
                  <Link
                    key={`${m.userId}-${idx}`}
                    href={`${hrefPrefix}/${m.userId}`}
                    className="block bg-bg-secondary border border-border rounded-lg p-3 hover:border-border-gold transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-gold">{m.memberNumber}</span>
                          <span className="text-sm text-text-primary font-medium">{m.name}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                          {m.contractDate && (
                            <div className="text-[10px] text-text-muted">
                              申請日: <span className="font-mono">{fmtDate(m.contractDate)}</span>
                            </div>
                          )}
                          {m.statusChangedAt && (
                            <div className="text-[10px] text-text-muted">
                              更新日: <span className="font-mono">{fmtDate(m.statusChangedAt)}</span>
                            </div>
                          )}
                          {m.planLabel && (
                            <div className="text-[10px] text-text-muted">
                              {m.planLabel}
                              {m.totalAmount !== undefined && m.totalAmount > 0 && (
                                <span className="font-mono ml-1">¥{m.totalAmount.toLocaleString()}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* クリニック予約日（大きく表示） */}
                      {m.clinicDate && m.clinicDate !== "---" && (
                        <div className="text-right shrink-0">
                          <div className="text-[9px] text-text-muted">予約日</div>
                          <div className="font-mono text-base text-gold font-bold">
                            {fmtDate(m.clinicDate)}
                          </div>
                          {m.clinicName && (
                            <div className="text-[10px] text-text-muted">{m.clinicName}</div>
                          )}
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-text-muted group-hover:text-gold transition-colors">
                      カルテを確認 →
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
