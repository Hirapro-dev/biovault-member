"use client";

/**
 * リアルなワイヤーフレーム人体アニメーション
 * 3Dメッシュ風のSVGで人体を表現
 */
export default function HumanWireframe() {
  // 色定義
  const c = {
    main: "rgba(191,160,75,",
    line: (o: number) => `rgba(191,160,75,${o})`,
  };

  return (
    <div className="relative w-full max-w-[280px] mx-auto" style={{ aspectRatio: "3/5" }}>
      {/* 背景グロー */}
      <div className="absolute inset-0 rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle, rgba(191,160,75,0.4) 0%, transparent 60%)", animation: "glow 3s ease-in-out infinite" }} />

      {/* 回転コンテナ */}
      <div className="relative w-full h-full" style={{ animation: "wireframe-float 6s ease-in-out infinite", perspective: "800px" }}>
        <svg viewBox="0 0 240 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" style={{ filter: "drop-shadow(0 0 8px rgba(191,160,75,0.25))" }}>

          {/* ===== 頭部（リアルな楕円メッシュ） ===== */}
          {/* 輪郭 */}
          <path d="M120 8 C140 8 158 18 162 38 C165 55 160 70 152 78 C146 84 138 88 130 90 L128 92 C126 94 124 94 120 94 C116 94 114 94 112 92 L110 90 C102 88 94 84 88 78 C80 70 75 55 78 38 C82 18 100 8 120 8Z" stroke={c.line(0.8)} strokeWidth="0.9" />
          {/* 横グリッド */}
          {[18, 28, 38, 48, 58, 68, 78, 88].map((y, i) => {
            const r = y < 38 ? 12 + y * 0.6 : y < 68 ? 38 - (y - 38) * 0.1 : 35 - (y - 68) * 0.8;
            return <ellipse key={`hh${i}`} cx="120" cy={y} rx={Math.max(r, 5)} ry="0.3" stroke={c.line(0.25)} strokeWidth="0.4" />;
          })}
          {/* 縦グリッド */}
          {[-20, -12, -4, 4, 12, 20].map((dx, i) => (
            <path key={`hv${i}`} d={`M${120 + dx} ${12 + Math.abs(dx) * 0.5} Q${120 + dx * 1.1} 50 ${120 + dx * 0.8} 90`} stroke={c.line(0.18)} strokeWidth="0.35" />
          ))}
          {/* 目・鼻・口のヒント */}
          <ellipse cx="110" cy="42" rx="4" ry="2.5" stroke={c.line(0.3)} strokeWidth="0.4" />
          <ellipse cx="130" cy="42" rx="4" ry="2.5" stroke={c.line(0.3)} strokeWidth="0.4" />
          <path d="M118 55 L120 60 L122 55" stroke={c.line(0.2)} strokeWidth="0.35" />
          <path d="M114 66 Q120 70 126 66" stroke={c.line(0.2)} strokeWidth="0.35" />
          {/* 耳 */}
          <path d="M78 38 Q72 40 73 52 Q74 58 78 56" stroke={c.line(0.3)} strokeWidth="0.5" />
          <path d="M162 38 Q168 40 167 52 Q166 58 162 56" stroke={c.line(0.3)} strokeWidth="0.5" />

          {/* ===== 首 ===== */}
          <path d="M108 92 L106 108" stroke={c.line(0.6)} strokeWidth="0.7" />
          <path d="M132 92 L134 108" stroke={c.line(0.6)} strokeWidth="0.7" />
          <path d="M112 92 L112 108" stroke={c.line(0.3)} strokeWidth="0.4" />
          <path d="M120 94 L120 108" stroke={c.line(0.3)} strokeWidth="0.4" />
          <path d="M128 92 L128 108" stroke={c.line(0.3)} strokeWidth="0.4" />
          {[96, 100, 104].map((y) => (
            <line key={`nh${y}`} x1="108" y1={y} x2="132" y2={y} stroke={c.line(0.2)} strokeWidth="0.3" />
          ))}

          {/* ===== 胴体（筋肉メッシュ） ===== */}
          {/* 外形 */}
          <path d="M106 108 C94 108 72 112 64 118 L58 125 L56 145 L58 170 L62 195 L65 210 L72 220" stroke={c.line(0.75)} strokeWidth="0.9" />
          <path d="M134 108 C146 108 168 112 176 118 L182 125 L184 145 L182 170 L178 195 L175 210 L168 220" stroke={c.line(0.75)} strokeWidth="0.9" />
          {/* 中央ライン */}
          <path d="M120 108 L120 220" stroke={c.line(0.35)} strokeWidth="0.5" />
          {/* 横グリッド（リブ・腹筋） */}
          {[115, 125, 135, 145, 155, 165, 175, 185, 195, 205, 215].map((y, i) => {
            const w = y < 140 ? 52 + (y - 108) * 0.3 : y < 180 ? 62 - (y - 140) * 0.05 : 60 - (y - 180) * 0.15;
            return <line key={`bh${i}`} x1={120 - w / 2} y1={y} x2={120 + w / 2} y2={y} stroke={c.line(0.22)} strokeWidth="0.4" />;
          })}
          {/* 縦グリッド */}
          {[-25, -15, -8, 8, 15, 25].map((dx, i) => (
            <line key={`bv${i}`} x1={120 + dx * 0.9} y1="110" x2={120 + dx * 1.1} y2="218" stroke={c.line(0.15)} strokeWidth="0.3" />
          ))}
          {/* 胸筋ライン */}
          <path d="M90 118 Q105 128 120 122 Q135 128 150 118" stroke={c.line(0.35)} strokeWidth="0.5" />
          <path d="M88 130 Q104 140 120 135 Q136 140 152 130" stroke={c.line(0.25)} strokeWidth="0.4" />
          {/* 腹筋セパレーション */}
          <path d="M112 155 Q120 158 128 155" stroke={c.line(0.2)} strokeWidth="0.35" />
          <path d="M112 170 Q120 173 128 170" stroke={c.line(0.2)} strokeWidth="0.35" />
          <path d="M113 185 Q120 188 127 185" stroke={c.line(0.2)} strokeWidth="0.35" />
          {/* 鎖骨 */}
          <path d="M106 110 L80 116 L64 118" stroke={c.line(0.4)} strokeWidth="0.5" />
          <path d="M134 110 L160 116 L176 118" stroke={c.line(0.4)} strokeWidth="0.5" />

          {/* ===== 左腕 ===== */}
          {/* 上腕 */}
          <path d="M64 118 L54 125 L46 150 L44 175" stroke={c.line(0.7)} strokeWidth="0.8" />
          <path d="M64 118 L68 125 L58 150 L52 175" stroke={c.line(0.4)} strokeWidth="0.5" />
          {/* 前腕 */}
          <path d="M44 175 L40 200 L38 225" stroke={c.line(0.65)} strokeWidth="0.75" />
          <path d="M52 175 L48 200 L44 225" stroke={c.line(0.35)} strokeWidth="0.45" />
          {/* 横グリッド */}
          {[130, 142, 155, 168, 182, 195, 208, 220].map((y, i) => (
            <line key={`la${i}`} x1={64 - (y - 118) * 0.2} y1={y} x2={54 - (y - 118) * 0.12} y2={y} stroke={c.line(0.18)} strokeWidth="0.3" />
          ))}
          {/* 肘 */}
          <ellipse cx="48" cy="175" rx="6" ry="4" stroke={c.line(0.3)} strokeWidth="0.45" />
          {/* 手 */}
          <path d="M38 225 L36 232 L34 240 M38 225 L38 233 L36 241 M38 225 L40 233 L39 240 M38 225 L42 231 L42 238 M44 225 L46 230 L44 235" stroke={c.line(0.4)} strokeWidth="0.4" />

          {/* ===== 右腕 ===== */}
          <path d="M176 118 L186 125 L194 150 L196 175" stroke={c.line(0.7)} strokeWidth="0.8" />
          <path d="M176 118 L172 125 L182 150 L188 175" stroke={c.line(0.4)} strokeWidth="0.5" />
          <path d="M196 175 L200 200 L202 225" stroke={c.line(0.65)} strokeWidth="0.75" />
          <path d="M188 175 L192 200 L196 225" stroke={c.line(0.35)} strokeWidth="0.45" />
          {[130, 142, 155, 168, 182, 195, 208, 220].map((y, i) => (
            <line key={`ra${i}`} x1={176 + (y - 118) * 0.2} y1={y} x2={186 + (y - 118) * 0.12} y2={y} stroke={c.line(0.18)} strokeWidth="0.3" />
          ))}
          <ellipse cx="192" cy="175" rx="6" ry="4" stroke={c.line(0.3)} strokeWidth="0.45" />
          <path d="M202 225 L204 232 L206 240 M202 225 L202 233 L204 241 M202 225 L200 233 L201 240 M202 225 L198 231 L198 238 M196 225 L194 230 L196 235" stroke={c.line(0.4)} strokeWidth="0.4" />

          {/* ===== 腰部 ===== */}
          <path d="M72 220 L70 228 Q82 240 100 242 L120 244 L140 242 Q158 240 170 228 L168 220" stroke={c.line(0.6)} strokeWidth="0.7" />
          <path d="M120 220 L120 244" stroke={c.line(0.3)} strokeWidth="0.4" />
          {[224, 230, 236].map((y) => (
            <line key={`ph${y}`} x1={72 + (y - 220) * 0.3} y1={y} x2={168 - (y - 220) * 0.3} y2={y} stroke={c.line(0.18)} strokeWidth="0.3" />
          ))}

          {/* ===== 左脚 ===== */}
          {/* 太もも */}
          <path d="M92 242 L84 270 L80 300 L78 320" stroke={c.line(0.75)} strokeWidth="0.85" />
          <path d="M108 242 L100 270 L94 300 L90 320" stroke={c.line(0.4)} strokeWidth="0.5" />
          {/* ふくらはぎ */}
          <path d="M78 320 L76 345 L74 370 L76 395" stroke={c.line(0.7)} strokeWidth="0.8" />
          <path d="M90 320 L88 345 L84 370 L82 395" stroke={c.line(0.35)} strokeWidth="0.45" />
          {/* 横グリッド */}
          {[252, 264, 276, 288, 300, 312, 330, 345, 360, 375, 390].map((y, i) => {
            const cx = y < 320 ? 96 - (y - 242) * 0.06 : 84 - (y - 320) * 0.04;
            const w = y < 320 ? 12 + (y - 242) * 0.02 : 10 - (y - 320) * 0.02;
            return <line key={`ll${i}`} x1={cx - w} y1={y} x2={cx + w} y2={y} stroke={c.line(0.2)} strokeWidth="0.3" />;
          })}
          {/* 膝 */}
          <ellipse cx="84" cy="320" rx="8" ry="6" stroke={c.line(0.35)} strokeWidth="0.5" />
          <ellipse cx="84" cy="320" rx="4" ry="3" stroke={c.line(0.15)} strokeWidth="0.3" />
          {/* 足 */}
          <path d="M76 395 L72 400 L66 406 L62 410 L80 412 L90 408 L86 400 L82 395" stroke={c.line(0.55)} strokeWidth="0.65" />
          <line x1="68" y1="408" x2="86" y2="406" stroke={c.line(0.2)} strokeWidth="0.3" />

          {/* ===== 右脚 ===== */}
          <path d="M148 242 L156 270 L160 300 L162 320" stroke={c.line(0.75)} strokeWidth="0.85" />
          <path d="M132 242 L140 270 L146 300 L150 320" stroke={c.line(0.4)} strokeWidth="0.5" />
          <path d="M162 320 L164 345 L166 370 L164 395" stroke={c.line(0.7)} strokeWidth="0.8" />
          <path d="M150 320 L152 345 L156 370 L158 395" stroke={c.line(0.35)} strokeWidth="0.45" />
          {[252, 264, 276, 288, 300, 312, 330, 345, 360, 375, 390].map((y, i) => {
            const cx = y < 320 ? 144 + (y - 242) * 0.06 : 156 + (y - 320) * 0.04;
            const w = y < 320 ? 12 + (y - 242) * 0.02 : 10 - (y - 320) * 0.02;
            return <line key={`rl${i}`} x1={cx - w} y1={y} x2={cx + w} y2={y} stroke={c.line(0.2)} strokeWidth="0.3" />;
          })}
          <ellipse cx="156" cy="320" rx="8" ry="6" stroke={c.line(0.35)} strokeWidth="0.5" />
          <ellipse cx="156" cy="320" rx="4" ry="3" stroke={c.line(0.15)} strokeWidth="0.3" />
          <path d="M164 395 L168 400 L174 406 L178 410 L160 412 L150 408 L154 400 L158 395" stroke={c.line(0.55)} strokeWidth="0.65" />
          <line x1="172" y1="408" x2="154" y2="406" stroke={c.line(0.2)} strokeWidth="0.3" />

          {/* ===== スキャンライン ===== */}
          <rect x="30" y="0" width="180" height="2" fill="url(#scanGrad)">
            <animate attributeName="y" values="-5;420;-5" dur="5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.7;0.7;0" keyTimes="0;0.1;0.9;1" dur="5s" repeatCount="indefinite" />
          </rect>
          <defs>
            <linearGradient id="scanGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(191,160,75,0)" />
              <stop offset="30%" stopColor="rgba(191,160,75,0.5)" />
              <stop offset="50%" stopColor="rgba(191,160,75,0.8)" />
              <stop offset="70%" stopColor="rgba(191,160,75,0.5)" />
              <stop offset="100%" stopColor="rgba(191,160,75,0)" />
            </linearGradient>
          </defs>

          {/* ===== 関節ノード ===== */}
          {[
            [120, 35], [120, 94],
            [64, 118], [176, 118],
            [48, 175], [192, 175],
            [38, 225], [202, 225],
            [120, 165], [120, 220],
            [84, 320], [156, 320],
            [76, 395], [164, 395],
          ].map(([x, y], i) => (
            <g key={`n${i}`}>
              <circle cx={x} cy={y} r="2" fill={c.line(0.9)}>
                <animate attributeName="r" values="1.5;2.5;1.5" dur={`${3.5 + i * 0.15}s`} repeatCount="indefinite" />
              </circle>
              <circle cx={x} cy={y} r="5" fill="none" stroke={c.line(0.15)}>
                <animate attributeName="r" values="3;6;3" dur={`${3.5 + i * 0.15}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0;0.3" dur={`${3.5 + i * 0.15}s`} repeatCount="indefinite" />
              </circle>
            </g>
          ))}
        </svg>
      </div>

      <style>{`
        @keyframes wireframe-float {
          0%, 100% { transform: translateY(0) rotateY(0deg); }
          25% { transform: translateY(-8px) rotateY(4deg); }
          50% { transform: translateY(0) rotateY(0deg); }
          75% { transform: translateY(-5px) rotateY(-4deg); }
        }
      `}</style>
    </div>
  );
}
