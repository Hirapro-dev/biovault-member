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
    let mouse = { x: w / 2, y: h / 2 };

    // ゴールドパレット（ロゴ準拠）
    const GOLD_COLORS = [
      { r: 191, g: 160, b: 75 },   // リッチゴールド
      { r: 212, g: 188, b: 106 },  // ライトゴールド
      { r: 165, g: 135, b: 55 },   // ディープゴールド
      { r: 220, g: 200, b: 150 },  // シャンパン
      { r: 180, g: 165, b: 130 },  // アンティーク
    ];

    // 浮遊パーティクル（微細なゴールドダスト）
    const particles = Array.from({ length: 50 }, () => {
      const color = GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)];
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -Math.random() * 0.15 - 0.02, // ゆっくり上昇
        r: Math.random() * 1.5 + 0.3,
        baseAlpha: Math.random() * 0.25 + 0.05,
        phase: Math.random() * Math.PI * 2,
        color,
      };
    });

    // ゆらぎライト（大きなぼかし光）
    const lights = Array.from({ length: 3 }, (_, i) => ({
      x: w * (0.2 + i * 0.3),
      y: h * (0.3 + Math.random() * 0.4),
      radius: 150 + Math.random() * 100,
      phase: (i * Math.PI * 2) / 3,
      speed: 0.003 + Math.random() * 0.002,
      color: GOLD_COLORS[i % GOLD_COLORS.length],
    }));

    // マウス追従（PC用）
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      time++;

      // ── ゆらぎライト（大きなソフトグロー） ──
      lights.forEach((light) => {
        const offsetX = Math.sin(time * light.speed + light.phase) * 60;
        const offsetY = Math.cos(time * light.speed * 0.7 + light.phase) * 40;
        const x = light.x + offsetX;
        const y = light.y + offsetY;
        const alpha = 0.02 + Math.sin(time * 0.005 + light.phase) * 0.01;

        const grad = ctx!.createRadialGradient(x, y, 0, x, y, light.radius);
        grad.addColorStop(0, `rgba(${light.color.r},${light.color.g},${light.color.b},${alpha})`);
        grad.addColorStop(0.5, `rgba(${light.color.r},${light.color.g},${light.color.b},${alpha * 0.3})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");

        ctx!.beginPath();
        ctx!.arc(x, y, light.radius, 0, Math.PI * 2);
        ctx!.fillStyle = grad;
        ctx!.fill();
      });

      // ── マウス周辺のソフトグロー（PC） ──
      const mouseGrad = ctx!.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 200);
      mouseGrad.addColorStop(0, "rgba(191,160,75,0.015)");
      mouseGrad.addColorStop(0.5, "rgba(191,160,75,0.005)");
      mouseGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.beginPath();
      ctx!.arc(mouse.x, mouse.y, 200, 0, Math.PI * 2);
      ctx!.fillStyle = mouseGrad;
      ctx!.fill();

      // ── パーティクル ──
      particles.forEach((p) => {
        // 移動
        p.x += p.vx;
        p.y += p.vy;

        // 微細な横揺れ
        p.x += Math.sin(time * 0.01 + p.phase) * 0.1;

        // 画面外→リセット
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        // 明滅
        const flicker = Math.sin(time * 0.02 + p.phase) * 0.5 + 0.5;
        const alpha = p.baseAlpha * (0.5 + flicker * 0.5);

        // グロー
        const glowSize = p.r * 4;
        const glow = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
        glow.addColorStop(0, `rgba(${p.color.r},${p.color.g},${p.color.b},${alpha * 0.5})`);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
        ctx!.fillStyle = glow;
        ctx!.fill();

        // コア
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${alpha})`;
        ctx!.fill();
      });

      // ── 画面下部のゴールドフォグ ──
      const fogGrad = ctx!.createLinearGradient(0, h, 0, h - 200);
      fogGrad.addColorStop(0, "rgba(140,110,42,0.03)");
      fogGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = fogGrad;
      ctx!.fillRect(0, h - 200, w, 200);

      raf = requestAnimationFrame(draw);
    }
    draw();

    const handleResize = () => {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
      lights.forEach((l, i) => {
        l.x = w * (0.2 + i * 0.3);
        l.y = h * (0.3 + Math.random() * 0.4);
      });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
}
