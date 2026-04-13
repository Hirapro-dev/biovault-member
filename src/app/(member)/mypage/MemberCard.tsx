"use client";

import { useState, useRef } from "react";

interface MemberCardProps {
  memberNumber: string;
  holderName: string;
  memberSince: string;
  storageExpiry: string | null;
  cultureFluidExpiry: string | null;
  remainingSessions: number | null;
  completedSessions: number;
}

export default function MemberCard({
  memberNumber,
  holderName,
  memberSince,
  storageExpiry,
  cultureFluidExpiry,
  remainingSessions,
  completedSessions,
}: MemberCardProps) {
  const [showBack, setShowBack] = useState(false);
  const [animating, setAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFlip = () => {
    if (animating) return;
    setAnimating(true);

    const el = containerRef.current;
    if (!el) return;

    // フェーズ1: 縮む
    el.style.transition = "transform 0.3s ease-in";
    el.style.transform = "scaleX(0)";

    const onShrink = () => {
      el.removeEventListener("transitionend", onShrink);
      // 面を切り替え
      setShowBack((prev) => !prev);

      // フェーズ2: 広がる
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.3s ease-out";
        el.style.transform = "scaleX(1)";

        const onExpand = () => {
          el.removeEventListener("transitionend", onExpand);
          setAnimating(false);
        };
        el.addEventListener("transitionend", onExpand);
      });
    };
    el.addEventListener("transitionend", onShrink);
  };

  return (
    <div
      className="mb-6 sm:mb-8 cursor-pointer"
      style={{ minWidth: 280, maxWidth: 540 }}
      onClick={handleFlip}
    >
      <div
        ref={containerRef}
        className="relative w-full aspect-[1.586/1]"
        style={{ transform: "scaleX(1)" }}
      >
        {/* ── 表面 ── */}
        {!showBack && (
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl p-6 sm:p-8 flex flex-col justify-between border border-white/15"
            style={{
              background: "#0A0A0C",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)",
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "url('/card_bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(160deg, transparent 5%, rgba(255,255,255,0.04) 15%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.04) 95%, transparent 95%)" }} />
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, transparent 0%, transparent 40%, rgba(255,255,255,0.04) 46%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.04) 54%, transparent 60%, transparent 100%)", backgroundSize: "400% 100%", animation: "card-shine 16s linear infinite" }} />
            </div>
            <style>{`@keyframes card-shine { 0% { background-position: 300% 0; } 100% { background-position: -100% 0; } }`}</style>
            <div className="relative z-10 flex items-center justify-between">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo_white.png" alt="BioVault" className="h-6 sm:h-8 w-auto opacity-70" />
              <div className="text-[9px] sm:text-[10px] tracking-[3px] font-light text-white/80">MEMBER</div>
            </div>
            <div className="relative z-10">
              <div className="font-mono text-xl sm:text-2xl tracking-[6px] sm:tracking-[8px]">
                {memberNumber}
              </div>
            </div>
            <div className="relative z-10 flex items-end justify-between">
              <div>
                <div className="text-[10px] sm:text-[12px] tracking-[2px] mb-1 text-white/80">CARD HOLDER</div>
                <div className="text-sm sm:text-base tracking-[2px] sm:tracking-[3px] uppercase">{holderName}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] sm:text-[12px] tracking-[2px] mb-1 text-white/80">MEMBER SINCE</div>
                <div className="font-mono text-[14px] sm:text-xs tracking-wider text-white/80">
                  {memberSince}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 裏面 ── */}
        {showBack && (
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl p-6 sm:p-8 flex flex-col justify-between border border-white/15"
            style={{
              background: "linear-gradient(145deg, #0E0E12 0%, #0A0A0C 40%, #0C0C10 100%)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)",
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(200deg, rgba(191,160,75,0.03) 0%, transparent 30%, transparent 70%, rgba(191,160,75,0.02) 100%)" }} />
            <div className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none" style={{ background: "linear-gradient(90deg, transparent 10%, rgba(191,160,75,0.15) 50%, transparent 90%)" }} />

            <div className="relative z-10 flex items-center justify-between">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo_white.png" alt="BioVault" className="h-5 sm:h-6 w-auto opacity-40" />
              <div className="text-[9px] sm:text-[10px] tracking-[3px] font-light text-white/40">STATUS</div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-center gap-4 sm:gap-5 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] sm:text-xs tracking-[0.5px] text-white/50 mb-1.5">iPS細胞保管期限</div>
                  <div className="font-mono text-base sm:text-lg text-white/90">
                    {storageExpiry || "---"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] sm:text-xs tracking-[0.5px] text-white/50 mb-1.5">iPS培養上清液 管理期限</div>
                  <div className="font-mono text-base sm:text-lg text-white/90">
                    {cultureFluidExpiry || "---"}
                  </div>
                </div>
              </div>

              <div className="h-[1px]" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent 100%)" }} />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] sm:text-xs tracking-[0.5px] text-white/50 mb-1.5">残り点滴施術回数</div>
                  <div className="font-mono text-xl sm:text-2xl text-white/90">
                    {remainingSessions !== null ? `${remainingSessions}` : "---"}
                    {remainingSessions !== null && <span className="text-sm sm:text-base text-white/50 ml-1">回</span>}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] sm:text-xs tracking-[0.5px] text-white/50 mb-1.5">点滴施術累計完了回数</div>
                  <div className="font-mono text-xl sm:text-2xl text-white/90">
                    {completedSessions}
                    <span className="text-sm sm:text-base text-white/50 ml-1">回</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <div className="font-mono text-[11px] sm:text-xs tracking-[4px] text-white/30 text-center">
                {memberNumber}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
