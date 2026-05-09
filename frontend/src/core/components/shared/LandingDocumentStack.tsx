import { useRef, useEffect } from "react";
import { useMantineColorScheme } from "@mantine/core";

/** Decorative stack only: window dots + grey bars — no text or i18n (avoids keys showing in the UI). */
export function LandingDocumentStack() {
  const stackRef  = useRef<HTMLDivElement>(null);
  const glareRef  = useRef<HTMLDivElement>(null);
  const frontRef  = useRef<HTMLDivElement>(null);
  const leftRef   = useRef<HTMLDivElement>(null);
  const rightRef  = useRef<HTMLDivElement>(null);
  const { colorScheme } = useMantineColorScheme();
  const schemeRef = useRef(colorScheme);
  schemeRef.current = colorScheme;

  useEffect(() => {
    const stack = stackRef.current;
    const glare = glareRef.current;
    const front = frontRef.current;
    const left  = leftRef.current;
    const right = rightRef.current;
    if (!stack || !glare || !front || !left || !right) return;

    let raf: number;
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;

    const handleMove = (e: MouseEvent) => {
      const rect = stack.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // Normalised offset from card centre, relative to viewport size
      const dx = (e.clientX - cx) / (window.innerWidth * 0.5);
      const dy = (e.clientY - cy) / (window.innerHeight * 0.5);

      targetRotY = Math.max(-18, Math.min(18, dx * 18));
      targetRotX = Math.max(-10, Math.min(10, dy * -10));

      // Glare: cursor position as percentage over the stack bounds
      const gx = ((e.clientX - rect.left) / rect.width) * 100;
      const gy = ((e.clientY - rect.top) / rect.height) * 100;

      // Fade glare out when cursor drifts far from the card
      const dist = Math.hypot(dx, dy);
      const intensity = Math.max(0, 1 - dist * 0.75) * 0.45;

      glare.style.background = `radial-gradient(ellipse 80% 55% at ${gx.toFixed(1)}% ${gy.toFixed(1)}%, rgba(255,255,255,${intensity.toFixed(3)}) 0%, transparent 65%)`;
    };

    const animate = () => {
      const t = 0.07;
      currentRotX += (targetRotX - currentRotX) * t;
      currentRotY += (targetRotY - currentRotY) * t;
      stack.style.transform = `perspective(600px) rotateX(${currentRotX.toFixed(3)}deg) rotateY(${currentRotY.toFixed(3)}deg)`;

      const mag  = Math.hypot(currentRotX, currentRotY);
      const gx   = (currentRotY * 3.5).toFixed(2);
      const gy   = (-currentRotX * 3.5 - 12).toFixed(2);
      const blur = (38 + mag * 2.5).toFixed(2);
      const isDark = schemeRef.current === "dark";

      // On dark backgrounds use light blue glows; on light backgrounds use soft blue-gray shadows.
      if (isDark) {
        front.style.boxShadow =
          `${gx}px ${gy}px ${blur}px rgba(210,220,255,0.22), ` +
          `${(currentRotY * 1.8).toFixed(2)}px ${(-currentRotX * 1.8 - 6).toFixed(2)}px 18px rgba(180,200,255,0.14)`;
      } else {
        front.style.boxShadow =
          `${gx}px ${gy}px ${blur}px rgba(80,100,180,0.18), ` +
          `${(currentRotY * 1.8).toFixed(2)}px ${(-currentRotX * 1.8 - 6).toFixed(2)}px 18px rgba(60,80,160,0.10)`;
      }

      const bgx = (currentRotY * 2).toFixed(2);
      const bgy = (-currentRotX * 2 - 8).toFixed(2);
      const bblur = (24 + mag * 1.5).toFixed(2);
      const backGlow = isDark
        ? `${bgx}px ${bgy}px ${bblur}px rgba(200,215,255,0.12)`
        : `${bgx}px ${bgy}px ${bblur}px rgba(80,100,180,0.10)`;
      left.style.boxShadow  = backGlow;
      right.style.boxShadow = backGlow;

      raf = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMove);
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const bar = (widthPct: number, heightPx: number, marginBottom: number) => ({
    width: `${widthPct}%`,
    height: heightPx,
    marginBottom: marginBottom || undefined,
  });

  return (
    <div ref={stackRef} aria-hidden className="landing-stack">
      <div ref={leftRef} className="landing-sheet landing-sheet--back landing-sheet--left">
        <div className="landing-sheet-side-body">
          <div
            className="landing-bar landing-bar--strong"
            style={bar(100, 10, 12)}
          />
          <div className="landing-bar" style={bar(80, 8, 8)} />
          <div className="landing-bar" style={bar(100, 8, 8)} />
          <div className="landing-bar" style={bar(60, 8, 0)} />
        </div>
      </div>

      <div ref={frontRef} className="landing-sheet landing-sheet--front">
        <div className="landing-sheet-header">
          <div
            className="landing-sheet-dot"
            style={{ backgroundColor: "rgba(255,255,255,0.35)" }}
          />
          <div
            className="landing-sheet-dot"
            style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
          />
          <div
            className="landing-sheet-dot"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          />
        </div>
        <div className="landing-sheet-body">
          <div
            className="landing-bar landing-bar--strong"
            style={bar(100, 10, 10)}
          />
          <div className="landing-bar" style={bar(80, 7, 6)} />
          <div className="landing-bar" style={bar(100, 7, 6)} />
          <div className="landing-bar" style={bar(66, 7, 6)} />
          <div className="landing-bar" style={bar(100, 7, 6)} />
          <div className="landing-bar" style={bar(88, 7, 6)} />
          <div className="landing-bar" style={bar(72, 7, 0)} />
        </div>

        {/* Specular glare — most visible on the coloured header, fades on white body */}
        <div
          ref={glareRef}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 12,
            pointerEvents: "none",
            zIndex: 20,
          }}
        />
      </div>

      <div ref={rightRef} className="landing-sheet landing-sheet--back landing-sheet--right">
        <div className="landing-sheet-side-body">
          <div
            className="landing-bar landing-bar--strong"
            style={bar(100, 10, 12)}
          />
          <div className="landing-bar" style={bar(75, 8, 8)} />
          <div className="landing-bar" style={bar(100, 8, 8)} />
          <div className="landing-bar" style={bar(80, 8, 0)} />
        </div>
      </div>
    </div>
  );
}
