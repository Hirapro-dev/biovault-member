"use client";

import { useEffect, useRef } from "react";

export default function GoldParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let time = 0;
    let raf: number;

    // DNA螺旋パラメータ
    const NUM_PAIRS = 20;       // 塩基対の数
    const HELIX_RADIUS = 40;    // 螺旋の半径
    const HELIX_SPACING = 28;   // 塩基対の間隔
    const ROTATION_SPEED = 0.008; // 回転速度
    const VERTICAL_SPEED = 0.3;  // 上昇速度

    // 微細パーティクル（DNA周囲に浮遊）
    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random() * 0.2 + 0.05,
    }));

    function drawDNAHelix(cx: number, cy: number, offset: number) {
      const totalHeight = NUM_PAIRS * HELIX_SPACING;
      const startY = cy - totalHeight / 2;

      for (let i = 0; i < NUM_PAIRS; i++) {
        const y = startY + i * HELIX_SPACING + ((offset * VERTICAL_SPEED) % HELIX_SPACING);
        const angle = time * ROTATION_SPEED + i * 0.35 + offset * 0.001;

        // 画面外はスキップ
        if (y < -20 || y > h + 20) continue;

        const x1 = cx + Math.cos(angle) * HELIX_RADIUS;
        const x2 = cx + Math.cos(angle + Math.PI) * HELIX_RADIUS;

        // 奥行き感（sin値で透明度とサイズを調整）
        const depth1 = (Math.sin(angle) + 1) / 2;            // 0〜1
        const depth2 = (Math.sin(angle + Math.PI) + 1) / 2;

        const alpha1 = 0.15 + depth1 * 0.35;
        const alpha2 = 0.15 + depth2 * 0.35;
        const size1 = 2 + depth1 * 2.5;
        const size2 = 2 + depth2 * 2.5;

        // 接続線（バックボーン）- 手前にある方を先に描画
        if (depth1 > 0.3 && depth2 > 0.3) {
          // 塩基対の横線（水素結合）
          const bridgeAlpha = Math.min(alpha1, alpha2) * 0.4;
          ctx!.beginPath();
          ctx!.moveTo(x1, y);
          ctx!.lineTo(x2, y);
          ctx!.strokeStyle = `rgba(191,160,75,${bridgeAlpha})`;
          ctx!.lineWidth = 0.5;
          ctx!.stroke();
        }

        // 左鎖のバックボーン（上のノードと接続）
        if (i > 0) {
          const prevAngle = time * ROTATION_SPEED + (i - 1) * 0.35 + offset * 0.001;
          const prevX1 = cx + Math.cos(prevAngle) * HELIX_RADIUS;
          const prevY = y - HELIX_SPACING;
          const prevDepth1 = (Math.sin(prevAngle) + 1) / 2;
          const backboneAlpha1 = Math.min(alpha1, 0.15 + prevDepth1 * 0.35) * 0.6;

          ctx!.beginPath();
          ctx!.moveTo(prevX1, prevY);
          ctx!.lineTo(x1, y);
          ctx!.strokeStyle = `rgba(191,160,75,${backboneAlpha1})`;
          ctx!.lineWidth = 1;
          ctx!.stroke();

          // 右鎖のバックボーン
          const prevX2 = cx + Math.cos(prevAngle + Math.PI) * HELIX_RADIUS;
          const prevDepth2 = (Math.sin(prevAngle + Math.PI) + 1) / 2;
          const backboneAlpha2 = Math.min(alpha2, 0.15 + prevDepth2 * 0.35) * 0.6;

          ctx!.beginPath();
          ctx!.moveTo(prevX2, prevY);
          ctx!.lineTo(x2, y);
          ctx!.strokeStyle = `rgba(191,160,75,${backboneAlpha2})`;
          ctx!.lineWidth = 1;
          ctx!.stroke();
        }

        // ノード（塩基）
        // 奥にあるものを先に、手前のものを後に描画
        const nodes = [
          { x: x1, depth: depth1, alpha: alpha1, size: size1 },
          { x: x2, depth: depth2, alpha: alpha2, size: size2 },
        ].sort((a, b) => a.depth - b.depth);

        nodes.forEach((node) => {
          // グロー
          const glow = ctx!.createRadialGradient(node.x, y, 0, node.x, y, node.size * 3);
          glow.addColorStop(0, `rgba(191,160,75,${node.alpha * 0.3})`);
          glow.addColorStop(1, "rgba(191,160,75,0)");
          ctx!.beginPath();
          ctx!.arc(node.x, y, node.size * 3, 0, Math.PI * 2);
          ctx!.fillStyle = glow;
          ctx!.fill();

          // ノード本体
          ctx!.beginPath();
          ctx!.arc(node.x, y, node.size, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(191,160,75,${node.alpha})`;
          ctx!.fill();
        });
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      time++;

      // DNA螺旋を描画（画面中央付近に配置）
      drawDNAHelix(w * 0.3, h * 0.5, time);
      drawDNAHelix(w * 0.75, h * 0.45, time * 0.7 + 100);

      // 微細パーティクル
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(191,160,75,${p.a})`;
        ctx!.fill();
      });

      raf = requestAnimationFrame(draw);
    }
    draw();

    const handleResize = () => {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
}
