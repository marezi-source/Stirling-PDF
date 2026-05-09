import { useEffect, useRef } from "react";

interface Wave {
  x: number;
  y: number;
  radius: number;
  speed: number;
  life: number;   // 1 → 0
  delay: number;  // seconds before this ring starts expanding
}

export function LandingWebGLBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let lastTime = performance.now();
    const waves: Wave[] = [];

    function resize() {
      canvas!.width  = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function onClick(e: MouseEvent) {
      const x = e.clientX;
      const y = e.clientY;

      // Three concentric rings per click — main shockwave + two echoes
      waves.push({ x, y, radius: 0, speed: 420, life: 1, delay: 0.00 });
      waves.push({ x, y, radius: 0, speed: 340, life: 1, delay: 0.06 });
      waves.push({ x, y, radius: 0, speed: 260, life: 1, delay: 0.14 });
    }

    function render() {
      const now = performance.now();
      const dt  = Math.min((now - lastTime) / 1000, 0.05);
      lastTime  = now;

      ctx!.fillStyle = "#08080c";
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i];

        if (w.delay > 0) { w.delay -= dt; continue; }

        // Shockwave decelerates — energy dissipating through air
        w.radius += w.speed * dt;
        w.speed  *= Math.pow(0.88, dt * 60);

        // Life tied to speed: wave dies when it has almost stopped
        w.life = Math.min(w.life, w.speed / 420);

        if (w.life <= 0.005 || w.radius > 1800) {
          waves.splice(i, 1);
          continue;
        }

        const a = w.life;
        const r = w.radius;

        ctx!.save();

        // Outer soft glow ring
        ctx!.beginPath();
        ctx!.arc(w.x, w.y, r, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(200,215,255,${(a * 0.06).toFixed(3)})`;
        ctx!.lineWidth   = 6;
        ctx!.shadowBlur  = 12;
        ctx!.shadowColor = `rgba(180,200,255,${(a * 0.08).toFixed(3)})`;
        ctx!.stroke();

        // Sharp core ring
        ctx!.beginPath();
        ctx!.arc(w.x, w.y, r, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(230,238,255,${(a * 0.10).toFixed(3)})`;
        ctx!.lineWidth   = 1;
        ctx!.shadowBlur  = 0;
        ctx!.stroke();

        // Inner pressure fill — visible only when ring is small and fresh
        if (r < 80) {
          const fillAlpha = a * (1 - r / 80) * 0.04;
          const grd = ctx!.createRadialGradient(w.x, w.y, 0, w.x, w.y, r);
          grd.addColorStop(0,   `rgba(200,215,255,0)`);
          grd.addColorStop(0.7, `rgba(200,215,255,0)`);
          grd.addColorStop(1,   `rgba(200,215,255,${fillAlpha.toFixed(3)})`);
          ctx!.fillStyle = grd;
          ctx!.beginPath();
          ctx!.arc(w.x, w.y, r, 0, Math.PI * 2);
          ctx!.fill();
        }

        ctx!.restore();
      }

      animFrame = requestAnimationFrame(render);
    }

    window.addEventListener("click", onClick);
    window.addEventListener("resize", resize);
    resize();
    ctx.fillStyle = "#08080c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    animFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("click", onClick);
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
      }}
    />
  );
}
