import { useEffect, useRef } from "react";

interface LandingWebGLBackgroundProps {
  blurred?: boolean;
}

export function LandingWebGLBackground({ blurred }: LandingWebGLBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let time = 0;
    let lastMs = performance.now();

    let mouseX = window.innerWidth  * 0.5;
    let mouseY = window.innerHeight * 0.5;

    // Three orbs: one follows the cursor, two drift autonomously
    let o1x = mouseX,              o1y = mouseY;
    let o2x = window.innerWidth  * 0.25, o2y = window.innerHeight * 0.65;
    let o3x = window.innerWidth  * 0.75, o3y = window.innerHeight * 0.30;

    function resize() {
      canvas!.width  = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function onMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }

    function render() {
      const now = performance.now();
      const dt  = Math.min((now - lastMs) / 1000, 0.05);
      lastMs = now;
      time  += dt;

      const w = canvas!.width;
      const h = canvas!.height;
      const isDark = true;

      // Orb 1 — smooth cursor follower
      o1x += (mouseX - o1x) * 0.05;
      o1y += (mouseY - o1y) * 0.05;

      // Orb 2 — slow autonomous drift, bottom-left region
      const t2x = w * 0.22 + Math.sin(time * 0.28) * w * 0.10;
      const t2y = h * 0.68 + Math.cos(time * 0.20) * h * 0.10;
      o2x += (t2x - o2x) * 0.018;
      o2y += (t2y - o2y) * 0.018;

      // Orb 3 — slow autonomous drift, top-right region, opposite phase
      const t3x = w * 0.78 + Math.cos(time * 0.22) * w * 0.11;
      const t3y = h * 0.28 + Math.sin(time * 0.32) * h * 0.11;
      o3x += (t3x - o3x) * 0.018;
      o3y += (t3y - o3y) * 0.018;

      // Base fill
      ctx!.fillStyle = isDark ? "#04040a" : "#f0f4ff";
      ctx!.fillRect(0, 0, w, h);

      // Orb 1 — follows cursor
      const r1 = w * 0.48;
      const g1 = ctx!.createRadialGradient(o1x, o1y, 0, o1x, o1y, r1);
      if (isDark) {
        g1.addColorStop(0,   "rgba(25, 40, 140, 0.28)");
        g1.addColorStop(0.4, "rgba(15, 25,  90, 0.12)");
        g1.addColorStop(1,   "rgba(5,   8,  30, 0)");
      } else {
        g1.addColorStop(0,   "rgba(100, 140, 255, 0.18)");
        g1.addColorStop(0.4, "rgba( 80, 110, 220, 0.08)");
        g1.addColorStop(1,   "rgba( 60,  80, 180, 0)");
      }
      ctx!.fillStyle = g1;
      ctx!.fillRect(0, 0, w, h);

      // Orb 2 — bottom-left drift
      const r2 = w * 0.40;
      const g2 = ctx!.createRadialGradient(o2x, o2y, 0, o2x, o2y, r2);
      if (isDark) {
        g2.addColorStop(0,   "rgba(65, 15, 120, 0.24)");
        g2.addColorStop(0.5, "rgba(38, 10,  80, 0.10)");
        g2.addColorStop(1,   "rgba(12,  3,  28, 0)");
      } else {
        g2.addColorStop(0,   "rgba(160, 100, 255, 0.14)");
        g2.addColorStop(0.5, "rgba(130,  80, 220, 0.06)");
        g2.addColorStop(1,   "rgba( 90,  50, 180, 0)");
      }
      ctx!.fillStyle = g2;
      ctx!.fillRect(0, 0, w, h);

      // Orb 3 — top-right drift
      const r3 = w * 0.36;
      const g3 = ctx!.createRadialGradient(o3x, o3y, 0, o3x, o3y, r3);
      if (isDark) {
        g3.addColorStop(0,   "rgba(8,  50, 110, 0.22)");
        g3.addColorStop(0.5, "rgba(5,  30,  75, 0.09)");
        g3.addColorStop(1,   "rgba(2,  10,  30, 0)");
      } else {
        g3.addColorStop(0,   "rgba( 60, 190, 220, 0.14)");
        g3.addColorStop(0.5, "rgba( 40, 160, 200, 0.06)");
        g3.addColorStop(1,   "rgba( 20, 120, 170, 0)");
      }
      ctx!.fillStyle = g3;
      ctx!.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(render);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("resize", resize);
    resize();
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        display: "block",
        pointerEvents: "none",
        filter: blurred ? "blur(8px) brightness(0.5)" : "none",
        transition: "filter 0.4s ease",
      }}
    />
  );
}
