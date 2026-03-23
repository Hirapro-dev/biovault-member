"use client";

import { IPS_STATUS_ORDER, IPS_STATUS_LABELS, IPS_STATUS_ICONS, IPS_STATUS_DESCRIPTIONS } from "@/types";
import type { IpsStatus } from "@/types";

export default function StatusTimeline({ currentStatus }: { currentStatus: IpsStatus }) {
  const currentIndex = IPS_STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="bg-bg-secondary border border-border rounded-md p-8 overflow-x-auto">
      <div className="flex items-start relative min-w-[700px]">
        {IPS_STATUS_ORDER.map((status, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;

          return (
            <div key={status} className="flex-1 text-center relative z-[1]">
              {/* 接続線 */}
              {i > 0 && (
                <div
                  className="absolute top-5 right-1/2 w-full h-[2px] z-0"
                  style={{
                    background: done
                      ? "linear-gradient(90deg, var(--color-gold-primary), var(--color-gold-light))"
                      : "var(--color-border)",
                  }}
                />
              )}
              {/* ノード */}
              <div
                className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center relative z-[2] transition-all duration-500 ${
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
              {/* ラベル */}
              <div
                className={`mt-3 text-[11px] tracking-wide leading-relaxed ${
                  done
                    ? "text-gold font-normal"
                    : active
                    ? "text-gold-light font-semibold"
                    : "text-text-muted font-normal"
                }`}
              >
                {IPS_STATUS_LABELS[status]}
              </div>
              {/* アクティブ説明 */}
              {active && (
                <div className="mt-2 text-[10px] text-text-secondary leading-relaxed px-1">
                  {IPS_STATUS_DESCRIPTIONS[status]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
