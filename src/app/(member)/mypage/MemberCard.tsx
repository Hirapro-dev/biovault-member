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
            className="absolute inset-0 overflow-hidden rounded-2xl p-6 sm:p-8 flex flex-col justify-between border border-black/10"
            style={{
              background: "#F7E3E0",
              boxShadow: "0 12px 34px rgba(0,0,0,0.18), 0 3px 10px rgba(0,0,0,0.12)",
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "url('/card_bg_sakura.png')", backgroundSize: "cover", backgroundPosition: "center" }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(160deg, transparent 5%, rgba(255,255,255,0.10) 15%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.10) 95%, transparent 95%)" }} />
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, transparent 0%, transparent 40%, rgba(255,255,255,0.18) 46%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 54%, transparent 60%, transparent 100%)", backgroundSize: "400% 100%", animation: "card-shine 16s linear infinite" }} />
            </div>
            <style>{`
              @keyframes card-shine { 0% { background-position: 300% 0; } 100% { background-position: -100% 0; } }
              @keyframes gold-glint { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
            `}</style>
            <div className="relative z-10 flex items-center justify-between">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="BioVault" className="h-6 sm:h-8 w-auto" style={{ filter: "brightness(0.72) saturate(1.6) drop-shadow(0 0 0.5px rgba(74,50,48,0.35))" }} />
              <div className="text-[9px] sm:text-[10px] tracking-[3px] font-light text-[#4A3230]/80">MEMBER</div>
            </div>
            <div className="relative z-10">
              {/* ゴールドのグラデーション文字 + 光が流れるアニメーション */}
              <div
                className="u-card-number text-xl sm:text-2xl tracking-[6px] sm:tracking-[8px]"
                style={{
                  backgroundImage:
                    "linear-gradient(105deg, #8C6A1F 0%, #C9A445 18%, #F2DC9B 38%, #FFF6DA 50%, #F2DC9B 62%, #C9A445 82%, #8C6A1F 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                  animation: "gold-glint 6s linear infinite",
                  filter: "drop-shadow(0 1px 1px rgba(140,106,31,0.30))",
                }}
              >
                {memberNumber}
              </div>
            </div>
            <div className="relative z-10 flex items-end justify-between">
              <div>
                <div className="text-[10px] sm:text-[12px] tracking-[2px] mb-1 text-[#4A3230]/70">CARD HOLDER</div>
                <div className="text-sm sm:text-base tracking-[2px] sm:tracking-[3px] uppercase text-[#4A3230]/90">{holderName}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] sm:text-[12px] tracking-[2px] mb-1 text-[#4A3230]/70">MEMBER SINCE</div>
                <div className="font-mono text-[14px] sm:text-xs tracking-wider text-[#4A3230]/80">
                  {memberSince}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 裏面 ── */}
        {showBack && (
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl p-6 sm:p-8 flex flex-col justify-between border border-black/10"
            style={{
              background: "#F7E3E0",
              boxShadow: "0 12px 34px rgba(0,0,0,0.18), 0 3px 10px rgba(0,0,0,0.12)",
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "url('/card_bg_sakura.png')", backgroundSize: "cover", backgroundPosition: "center" }} />
            {/* データ可読性のため、画像の上に薄い白幕を重ねる */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.50) 0%, rgba(255,255,255,0.30) 100%)" }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(200deg, rgba(191,160,75,0.05) 0%, transparent 30%, transparent 70%, rgba(191,160,75,0.04) 100%)" }} />
            <div className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none" style={{ background: "linear-gradient(90deg, transparent 10%, rgba(191,160,75,0.35) 50%, transparent 90%)" }} />

            <div className="relative z-10 flex items-center justify-between">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="BioVault" className="h-5 sm:h-6 w-auto opacity-90" style={{ filter: "brightness(0.72) saturate(1.6) drop-shadow(0 0 0.5px rgba(74,50,48,0.35))" }} />
              <div className="text-[9px] sm:text-[10px] tracking-[3px] font-light text-[#4A3230]/50">STATUS</div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-center gap-4 sm:gap-5 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] sm:text-xs tracking-[0.5px] text-[#4A3230]/60 mb-1.5">iPS細胞保管期限</div>
                  <div className="font-mono text-base sm:text-lg text-[#4A3230]/90">
                    {storageExpiry || "---"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] sm:text-xs tracking-[0.5px] text-[#4A3230]/60 mb-1.5">iPS培養上清液 管理期限</div>
                  <div className="font-mono text-base sm:text-lg text-[#4A3230]/90">
                    {cultureFluidExpiry || "---"}
                  </div>
                </div>
              </div>

              <div className="h-[1px]" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(74,50,48,0.15) 20%, rgba(74,50,48,0.15) 80%, transparent 100%)" }} />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] sm:text-xs tracking-[0.5px] text-[#4A3230]/60 mb-1.5">残り点滴施術回数</div>
                  <div className="font-mono text-xl sm:text-2xl text-[#4A3230]/90">
                    {remainingSessions !== null ? `${remainingSessions}` : "---"}
                    {remainingSessions !== null && <span className="text-sm sm:text-base text-[#4A3230]/60 ml-1">回</span>}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] sm:text-xs tracking-[0.5px] text-[#4A3230]/60 mb-1.5">点滴施術累計完了回数</div>
                  <div className="font-mono text-xl sm:text-2xl text-[#4A3230]/90">
                    {completedSessions}
                    <span className="text-sm sm:text-base text-[#4A3230]/60 ml-1">回</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <div className="font-mono text-[11px] sm:text-xs tracking-[4px] text-[#4A3230]/40 text-center">
                {memberNumber}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
