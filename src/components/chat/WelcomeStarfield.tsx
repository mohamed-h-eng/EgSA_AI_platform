import React, { useEffect, useRef, useState } from 'react';

// Quiet night sky behind the chat welcome screen (plan: agent/WELCOME_ANIMATION_PLAN.md).
// Shown only while the conversation is empty: it fades out and unmounts once the chat starts, so
// nothing moves while people read answers. One <canvas>, ~30 fps, paused in background tabs,
// a single static frame under prefers-reduced-motion. Colours come from theme tokens.

const FPS = 30;
const DRIFT_PX_PER_S = 4;
const FADE_OUT_MS = 300;

interface Star {
  x: number;
  y: number;
  r: number;
  depth: number; // 0.3–1: size, brightness and drift speed
  phase: number;
  period: number; // twinkle cycle, seconds
}

interface Meteor {
  x: number;
  y: number;
  dx: number;
  dy: number;
  start: number;
  duration: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export const WelcomeStarfield: React.FC<{ active: boolean }> = ({ active }) => {
  // Stay mounted through the fade-out, then leave the page entirely.
  const [present, setPresent] = useState(active);
  if (active && !present) setPresent(true);

  useEffect(() => {
    if (active) return;
    const timer = setTimeout(() => setPresent(false), FADE_OUT_MS);
    return () => clearTimeout(timer);
  }, [active]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!present) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let meteor: Meteor | null = null;
    let nextMeteorAt = performance.now() + rand(4000, 7000);
    let frame = 0;
    let lastDraw = 0;
    let colors = { star: '#ffffff', accent: '#0071e3', dark: true };

    const readColors = () => {
      const css = getComputedStyle(document.documentElement);
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      colors = {
        // Dark: near-white stars. Light: muted grey "dust".
        star: css.getPropertyValue(dark ? '--text-primary' : '--text-muted').trim() || (dark ? '#f5f5f7' : '#86868b'),
        accent: css.getPropertyValue('--accent-primary').trim() || '#0071e3',
        dark,
      };
    };

    const seed = () => {
      const count = Math.round(Math.min(90, Math.max(40, (width * height) / 9000)));
      stars = Array.from({ length: count }, () => {
        const depth = rand(0.3, 1);
        return { x: rand(0, width), y: rand(0, height), r: 0.5 + depth * 1.1, depth, phase: rand(0, Math.PI * 2), period: rand(3, 7) };
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    // Meteors start near a top corner and cross only that corner, away from the title and prompts.
    const spawnMeteor = (now: number) => {
      const fromLeft = Math.random() < 0.5;
      const travel = Math.min(width, height) * 0.28;
      meteor = {
        x: fromLeft ? rand(0.04, 0.2) * width : rand(0.8, 0.96) * width,
        y: rand(0.03, 0.18) * height,
        dx: (fromLeft ? 1 : -1) * travel * 0.8,
        dy: travel * 0.6,
        start: now,
        duration: 800,
      };
    };

    const draw = (now: number, animate: boolean) => {
      ctx.clearRect(0, 0, width, height);
      const t = now / 1000;
      const maxAlpha = colors.dark ? 0.8 : 0.45;
      const minAlpha = colors.dark ? 0.2 : 0.1;

      ctx.fillStyle = colors.star;
      for (const s of stars) {
        const x = animate ? (s.x + t * DRIFT_PX_PER_S * s.depth) % width : s.x;
        const twinkle = animate ? (Math.sin((t / s.period) * Math.PI * 2 + s.phase) + 1) / 2 : 0.6;
        ctx.globalAlpha = (minAlpha + (maxAlpha - minAlpha) * twinkle) * s.depth;
        ctx.beginPath();
        ctx.arc(x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (animate && meteor) {
        const p = (now - meteor.start) / meteor.duration;
        if (p >= 1) {
          meteor = null;
          nextMeteorAt = now + rand(8000, 12000);
        } else {
          const headX = meteor.x + meteor.dx * p;
          const headY = meteor.y + meteor.dy * p;
          const tail = 0.35;
          const tailX = headX - meteor.dx * tail;
          const tailY = headY - meteor.dy * tail;
          const fade = Math.sin(p * Math.PI); // in, then out
          const gradient = ctx.createLinearGradient(tailX, tailY, headX, headY);
          gradient.addColorStop(0, 'transparent');
          gradient.addColorStop(0.7, colors.star);
          gradient.addColorStop(1, colors.accent);
          ctx.globalAlpha = fade * (colors.dark ? 0.9 : 0.55);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1.2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(headX, headY);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (now - lastDraw < 1000 / FPS) return;
      lastDraw = now;
      if (!meteor && now >= nextMeteorAt) spawnMeteor(now);
      draw(now, true);
    };

    const start = () => {
      cancelAnimationFrame(frame);
      // Paint immediately so the sky is there before the first animation frame (or at all, if
      // motion is reduced or the tab starts in the background).
      draw(performance.now(), false);
      if (!reducedMotion.matches && !document.hidden) frame = requestAnimationFrame(loop);
    };

    readColors();
    resize();
    start();

    // Resizing the canvas clears it, so repaint straight away rather than waiting for a frame.
    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw(performance.now(), !reducedMotion.matches && !document.hidden);
    });
    resizeObserver.observe(canvas);

    // Theme / accent changes are applied to <html> by App.tsx.
    const themeObserver = new MutationObserver(() => {
      readColors();
      draw(performance.now(), !reducedMotion.matches && !document.hidden);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });

    const onVisibility = () => (document.hidden ? cancelAnimationFrame(frame) : start());
    document.addEventListener('visibilitychange', onVisibility);
    reducedMotion.addEventListener('change', start);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMotion.removeEventListener('change', start);
    };
  }, [present]);

  if (!present) return null;
  return <canvas ref={canvasRef} className="welcome-starfield" data-state={active ? 'on' : 'leaving'} aria-hidden="true" />;
};
