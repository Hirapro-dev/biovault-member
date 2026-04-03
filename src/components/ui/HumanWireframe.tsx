"use client";

/**
 * ワイヤーフレーム人体アニメーション
 * ゆっくり回転するような3Dエフェクト付きのSVG
 */
export default function HumanWireframe() {
  return (
    <div className="relative w-full max-w-[280px] mx-auto" style={{ aspectRatio: "3/5" }}>
      {/* 背景グロー */}
      <div
        className="absolute inset-0 animate-pulse-gold rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(191,160,75,0.3) 0%, transparent 70%)" }}
      />

      {/* 回転コンテナ */}
      <div className="relative w-full h-full" style={{ animation: "wireframe-float 6s ease-in-out infinite" }}>
        <svg
          viewBox="0 0 200 340"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          style={{ filter: "drop-shadow(0 0 12px rgba(191,160,75,0.3))" }}
        >
          {/* グリッドライン（横） */}
          {Array.from({ length: 30 }, (_, i) => (
            <line
              key={`h${i}`}
              x1="30" y1={20 + i * 10}
              x2="170" y2={20 + i * 10}
              stroke="rgba(191,160,75,0.06)"
              strokeWidth="0.3"
            />
          ))}

          {/* 頭部 */}
          <ellipse cx="100" cy="35" rx="22" ry="28" stroke="rgba(191,160,75,0.7)" strokeWidth="0.8" />
          <ellipse cx="100" cy="35" rx="18" ry="24" stroke="rgba(191,160,75,0.4)" strokeWidth="0.5" />
          <ellipse cx="100" cy="35" rx="14" ry="20" stroke="rgba(191,160,75,0.2)" strokeWidth="0.4" />
          {/* 顔のグリッド（横） */}
          {[22, 30, 38, 46].map((y) => (
            <ellipse key={`fh${y}`} cx="100" cy={y} rx={20 - Math.abs(y - 35) * 0.6} ry="0" stroke="rgba(191,160,75,0.3)" strokeWidth="0.4">
              <animate attributeName="ry" values="0;0.3;0" dur="4s" repeatCount="indefinite" />
            </ellipse>
          ))}
          {/* 顔のグリッド（縦） */}
          {[88, 94, 100, 106, 112].map((x) => (
            <line key={`fv${x}`} x1={x} y1="10" x2={x} y2="60" stroke="rgba(191,160,75,0.15)" strokeWidth="0.3" />
          ))}

          {/* 首 */}
          <line x1="92" y1="60" x2="92" y2="75" stroke="rgba(191,160,75,0.6)" strokeWidth="0.7" />
          <line x1="108" y1="60" x2="108" y2="75" stroke="rgba(191,160,75,0.6)" strokeWidth="0.7" />

          {/* 胴体（台形） */}
          <path d="M70 75 L130 75 L135 160 L65 160 Z" stroke="rgba(191,160,75,0.7)" strokeWidth="0.8" fill="none" />
          {/* 胴体グリッド（横） */}
          {[85, 95, 105, 115, 125, 135, 145, 155].map((y) => {
            const w = 30 + (y - 75) * 0.06;
            return <line key={`bh${y}`} x1={100 - w} y1={y} x2={100 + w} y2={y} stroke="rgba(191,160,75,0.3)" strokeWidth="0.4" />;
          })}
          {/* 胴体グリッド（縦） */}
          {[80, 90, 100, 110, 120].map((x) => (
            <line key={`bv${x}`} x1={x} y1="75" x2={x + (x > 100 ? 2 : x < 100 ? -2 : 0)} y2="160" stroke="rgba(191,160,75,0.2)" strokeWidth="0.3" />
          ))}
          {/* 胸筋ライン */}
          <path d="M85 85 Q100 95 115 85" stroke="rgba(191,160,75,0.35)" strokeWidth="0.5" fill="none" />
          <path d="M80 100 Q100 110 120 100" stroke="rgba(191,160,75,0.25)" strokeWidth="0.4" fill="none" />

          {/* 肩 */}
          <line x1="70" y1="75" x2="45" y2="82" stroke="rgba(191,160,75,0.7)" strokeWidth="0.8" />
          <line x1="130" y1="75" x2="155" y2="82" stroke="rgba(191,160,75,0.7)" strokeWidth="0.8" />

          {/* 左腕 */}
          <path d="M45 82 L38 130 L42 175" stroke="rgba(191,160,75,0.6)" strokeWidth="0.8" fill="none" />
          <path d="M45 82 L52 130 L48 175" stroke="rgba(191,160,75,0.4)" strokeWidth="0.5" fill="none" />
          {[95, 110, 125, 140, 155, 170].map((y) => (
            <line key={`lah${y}`} x1={50 - (y - 82) * 0.08} y1={y} x2={40 - (y - 82) * 0.02} y2={y} stroke="rgba(191,160,75,0.25)" strokeWidth="0.3" />
          ))}
          {/* 左手 */}
          <path d="M42 175 L38 185 M42 175 L40 186 M42 175 L43 186 M42 175 L45 184" stroke="rgba(191,160,75,0.4)" strokeWidth="0.4" fill="none" />

          {/* 右腕 */}
          <path d="M155 82 L162 130 L158 175" stroke="rgba(191,160,75,0.6)" strokeWidth="0.8" fill="none" />
          <path d="M155 82 L148 130 L152 175" stroke="rgba(191,160,75,0.4)" strokeWidth="0.5" fill="none" />
          {[95, 110, 125, 140, 155, 170].map((y) => (
            <line key={`rah${y}`} x1={150 + (y - 82) * 0.08} y1={y} x2={160 + (y - 82) * 0.02} y2={y} stroke="rgba(191,160,75,0.25)" strokeWidth="0.3" />
          ))}
          {/* 右手 */}
          <path d="M158 175 L162 185 M158 175 L160 186 M158 175 L157 186 M158 175 L155 184" stroke="rgba(191,160,75,0.4)" strokeWidth="0.4" fill="none" />

          {/* 腰 */}
          <path d="M65 160 L60 170 L100 178 L140 170 L135 160" stroke="rgba(191,160,75,0.6)" strokeWidth="0.7" fill="none" />

          {/* 左脚 */}
          <path d="M80 170 L72 230 L70 295" stroke="rgba(191,160,75,0.7)" strokeWidth="0.8" fill="none" />
          <path d="M95 170 L88 230 L82 295" stroke="rgba(191,160,75,0.4)" strokeWidth="0.5" fill="none" />
          {[185, 200, 215, 230, 245, 260, 275, 290].map((y) => {
            const offset = (y - 170) * 0.04;
            return <line key={`llh${y}`} x1={90 - offset} y1={y} x2={78 - offset} y2={y} stroke="rgba(191,160,75,0.25)" strokeWidth="0.3" />;
          })}
          {/* 左膝 */}
          <circle cx="75" cy="230" r="5" stroke="rgba(191,160,75,0.3)" strokeWidth="0.5" fill="none" />
          {/* 左足 */}
          <path d="M70 295 L62 305 L58 310 L75 312 L85 308 L82 295" stroke="rgba(191,160,75,0.5)" strokeWidth="0.6" fill="none" />

          {/* 右脚 */}
          <path d="M120 170 L128 230 L130 295" stroke="rgba(191,160,75,0.7)" strokeWidth="0.8" fill="none" />
          <path d="M105 170 L112 230 L118 295" stroke="rgba(191,160,75,0.4)" strokeWidth="0.5" fill="none" />
          {[185, 200, 215, 230, 245, 260, 275, 290].map((y) => {
            const offset = (y - 170) * 0.04;
            return <line key={`rlh${y}`} x1={110 + offset} y1={y} x2={122 + offset} y2={y} stroke="rgba(191,160,75,0.25)" strokeWidth="0.3" />;
          })}
          {/* 右膝 */}
          <circle cx="125" cy="230" r="5" stroke="rgba(191,160,75,0.3)" strokeWidth="0.5" fill="none" />
          {/* 右足 */}
          <path d="M130 295 L138 305 L142 310 L125 312 L115 308 L118 295" stroke="rgba(191,160,75,0.5)" strokeWidth="0.6" fill="none" />

          {/* スキャンライン（上から下へ流れる） */}
          <line x1="30" y1="0" x2="170" y2="0" stroke="rgba(191,160,75,0.6)" strokeWidth="1.5">
            <animate attributeName="y1" values="0;340;0" dur="4s" repeatCount="indefinite" />
            <animate attributeName="y2" values="0;340;0" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.8;0" dur="4s" repeatCount="indefinite" />
          </line>

          {/* ノードポイント（関節） */}
          {[
            [100, 35], // 頭
            [70, 75], [130, 75], // 肩
            [100, 120], // 胸中央
            [45, 82], [155, 82], // 肩先
            [38, 130], [162, 130], // 肘
            [42, 175], [158, 175], // 手首
            [100, 168], // 腰中央
            [75, 230], [125, 230], // 膝
            [70, 295], [130, 295], // 足首
          ].map(([x, y], i) => (
            <circle key={`node${i}`} cx={x} cy={y} r="1.5" fill="rgba(191,160,75,0.8)">
              <animate attributeName="r" values="1.5;2.5;1.5" dur={`${3 + i * 0.2}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;1;0.8" dur={`${3 + i * 0.2}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      </div>

      {/* CSSアニメーション */}
      <style>{`
        @keyframes wireframe-float {
          0%, 100% { transform: translateY(0) rotateY(0deg); }
          25% { transform: translateY(-6px) rotateY(5deg); }
          50% { transform: translateY(0) rotateY(0deg); }
          75% { transform: translateY(-4px) rotateY(-5deg); }
        }
      `}</style>
    </div>
  );
}
