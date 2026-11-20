// lameduse/AuthBackground.tsx
// ===========================
// Animated, theme-aware backdrop for the LaMeDuSe sign-in pages (see AuthLayout).
//
// Layers (back to front):
//   1. base gradient
//   2. aurora: large soft brand-colored blobs drifting slowly (pure CSS, compositor-only transforms)
//   3. particles: canvas of softly glowing "bioluminescent" motes rising like plankton
//   4. spotlight: soft glow that eases after the pointer
//   5. grid + grain: fine texture that keeps large gradients from looking flat
//
// Performance: pre-rendered particle sprites, DPR capped at 2, particle count scaled to the
// viewport, paused while the tab is hidden. Honors prefers-reduced-motion (one static frame).

import React from "react";

const PALETTE = {
  dark: ["#01B4B6", "#0080E2", "#7FD4FF", "#8B7BFF"],
  light: ["#0080E2", "#01B4B6", "#5B4FE0", "#3FA9F5"],
};

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  sway: number;
  swaySpeed: number;
  phase: number;
  twinkle: number;
  alpha: number;
  depth: number;
  sprite: number;
}

function createSprite(color: string, size: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const r = size / 2;
    const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.18, color + "cc");
    gradient.addColorStop(0.45, color + "33");
    gradient.addColorStop(1, color + "00");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  return canvas;
}

function random(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createParticle(width: number, height: number, spriteCount: number, initial: boolean): Particle {
  const depth = Math.random(); // 0 = far, 1 = near
  return {
    x: Math.random() * width,
    y: initial ? Math.random() * height : height + 20,
    size: 2 + depth * depth * 9,
    speed: 0.08 + depth * 0.32,
    sway: random(6, 22),
    swaySpeed: random(0.0003, 0.0009),
    phase: Math.random() * Math.PI * 2,
    twinkle: random(0.0008, 0.002),
    alpha: 0.25 + depth * 0.55,
    depth,
    sprite: Math.floor(Math.random() * spriteCount),
  };
}

export function AuthBackground({dark = false}: {dark?: boolean}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const spotlightRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const spotlight = spotlightRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !spotlight || !ctx) {
      return undefined;
    }

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const sprites = (dark ? PALETTE.dark : PALETTE.light).map((color) => createSprite(color, 64));

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let frame = 0;
    let lastTime = performance.now();
    const pointer = {x: 0.5, y: 0.35};
    const smooth = {x: 0.5, y: 0.35};

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.min(90, Math.max(28, Math.round((width * height) / 16000)));
      if (particles.length > target) {
        particles = particles.slice(0, target);
      }
      while (particles.length < target) {
        particles.push(createParticle(width, height, sprites.length, true));
      }
    };

    const draw = (time: number) => {
      const dt = Math.min(64, time - lastTime);
      lastTime = time;

      smooth.x += (pointer.x - smooth.x) * 0.06;
      smooth.y += (pointer.y - smooth.y) * 0.06;
      // moved with a transform (compositor only) rather than repainting a full-screen gradient
      spotlight.style.transform = `translate3d(${(smooth.x * width).toFixed(1)}px, ${(smooth.y * height).toFixed(1)}px, 0) translate(-50%, -50%)`;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = dark ? "lighter" : "source-over";

      const parallaxX = (smooth.x - 0.5) * 30;
      const parallaxY = (smooth.y - 0.5) * 20;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!reducedMotion) {
          p.y -= p.speed * dt * 0.06;
          if (p.y < -30) {
            particles[i] = createParticle(width, height, sprites.length, false);
            continue;
          }
        }

        const x = p.x + Math.sin(time * p.swaySpeed + p.phase) * p.sway + parallaxX * p.depth;
        const y = p.y + parallaxY * p.depth;
        const twinkle = 0.65 + 0.35 * Math.sin(time * p.twinkle + p.phase);
        // fade in from the bottom and out near the top
        const edge = Math.min(1, (height - p.y) / 120, (p.y + 30) / 160);

        ctx.globalAlpha = Math.max(0, p.alpha * twinkle * edge * (dark ? 1 : 0.8));
        const s = p.size * 4;
        ctx.drawImage(sprites[p.sprite], x - s / 2, y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;

      if (!reducedMotion) {
        frame = requestAnimationFrame(draw);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      pointer.x = e.clientX / Math.max(1, width);
      pointer.y = e.clientY / Math.max(1, height);
    };

    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden && !reducedMotion) {
        lastTime = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    if (!reducedMotion) {
      window.addEventListener("pointermove", onPointerMove, {passive: true});
    }
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [dark]);

  return (
    <div className={`ld-bg ${dark ? "ld-bg-dark" : "ld-bg-light"}`} aria-hidden="true">
      <div className="ld-bg-aurora">
        <span className="ld-blob ld-blob-1" />
        <span className="ld-blob ld-blob-2" />
        <span className="ld-blob ld-blob-3" />
        <span className="ld-blob ld-blob-4" />
      </div>
      <canvas ref={canvasRef} className="ld-bg-particles" />
      <div ref={spotlightRef} className="ld-bg-spotlight" />
      <div className="ld-bg-grid" />
      <div className="ld-bg-grain" />
    </div>
  );
}
