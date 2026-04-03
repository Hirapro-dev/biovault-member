"use client";

import { IPS_STATUS_ORDER, IPS_STATUS_LABELS, IPS_STATUS_ICONS } from "@/types";
import type { IpsStatus } from "@/types";

// 各ステータスに到達した日時のマップ
type StatusDates = Partial<Record<IpsStatus, string>>;

export default function StatusTimeline({
  currentStatus,
  statusDates,
}: {
  currentStatus: IpsStatus;
  statusDates?: StatusDates;
}) {
  const currentIndex = IPS_STATUS_ORDER.indexOf(currentStatus);

  // 日付フォーマット
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-4">
      {/* モバイル: 縦タイムライン */}
      <div className="block sm:hidden">
        {/* ノードサイズ36px → 中心18px。ml-3(12px) + 18px = 30pxが線の位置 */}
        <div className="relative ml-3">
          {/* 縦の接続線 — ノード中心に正確に合わせる (left = ノード幅の半分 - 線幅の半分 = 17px) */}
          <div
            className="absolute left-[17px] top-[18px] bottom-[18px] w-[2px]"
            style={{
              background: `linear-gradient(to bottom, var(--color-gold-primary) ${((currentIndex) / (IPS_STATUS_ORDER.length - 1)) * 100}%, var(--color-border) ${((currentIndex) / (IPS_STATUS_ORDER.length - 1)) * 100}%)`,
            }}
          />
          {IPS_STATUS_ORDER.map((status, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            const dateStr = done || active ? formatDate(statusDates?.[status]) : null;

            return (
              <div key={status} className="flex items-start gap-4 pb-7 last:pb-0 relative">
                {/* ノード */}
                <div
                  className={`relative z-[2] w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                    done
                      ? "text-bg-primary text-sm font-bold"
                      : active
                      ? "border-2 border-gold text-gold text-sm"
                      : "border border-border text-text-muted text-sm"
                  } ${active ? "animate-pulse-gold" : ""}`}
                  style={{
                    background: done
                      ? "linear-gradient(135deg, var(--color-gold-primary), var(--color-gold-light))"
                      : active
                      ? "var(--color-bg-primary)"
                      : "var(--color-bg-elevated)",
                  }}
                >
                  {done ? "✓" : IPS_STATUS_ICONS[status]}
                </div>
                {/* ラベル */}
                <div className="pt-1.5 min-w-0">
                  <div
                    className={`text-sm ${
                      done ? "text-gold" : active ? "text-gold-light font-semibold" : "text-text-muted"
                    }`}
                  >
                    {IPS_STATUS_LABELS[status]}
                  </div>
                  {dateStr && (
                    <div className="mt-0.5 text-[10px] text-text-muted font-mono">
                      {dateStr}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PC: 横タイムライン */}
      <div className="hidden sm:block overflow-x-auto">
        <div className="flex items-start relative min-w-[700px]">
          {IPS_STATUS_ORDER.map((status, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            const dateStr = done || active ? formatDate(statusDates?.[status]) : null;

            return (
              <div key={status} className="flex-1 text-center relative">
                {i > 0 && (
                  <div
                    className="absolute top-5 right-1/2 w-full h-[2px] z-[1]"
                    style={{
                      background: done
                        ? "linear-gradient(90deg, var(--color-gold-primary), var(--color-gold-light))"
                        : "var(--color-border)",
                    }}
                  />
                )}
                <div
                  className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center relative z-[3] transition-all duration-500 ${
                    done
                      ? "text-bg-primary text-base font-bold"
                      : active
                      ? "border-2 border-gold text-gold text-sm"
                      : "border border-border text-text-muted text-sm"
                  } ${active ? "animate-pulse-gold" : ""}`}
                  style={{
                    background: done
                      ? "linear-gradient(135deg, var(--color-gold-primary), var(--color-gold-light))"
                      : active
                      ? "var(--color-bg-primary)"
                      : "var(--color-bg-elevated)",
                  }}
                >
                  {done ? "✓" : IPS_STATUS_ICONS[status]}
                </div>
                <div
                  className={`mt-3 text-xs tracking-wide leading-relaxed ${
                    done ? "text-gold font-normal" : active ? "text-gold-light font-semibold" : "text-text-muted font-normal"
                  }`}
                >
                  {IPS_STATUS_LABELS[status]}
                </div>
                {dateStr && (
                  <div className="mt-1 text-[10px] text-text-muted font-mono">
                    {dateStr}
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
