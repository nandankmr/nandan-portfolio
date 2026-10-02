'use client';
import { useEffect, useRef } from 'react';

// A calm dot grid behind the hero. Dots lean toward the cursor (a soft
// "magnetic field"), spring back, and breathe slightly when idle.
// Pauses off-screen; static under reduced motion.
export default function HeroField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const GAP = 26, R = 170;
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true;
    let dots: { x: number; y: number; ox: number; oy: number; vx: number; vy: number }[] = [];
    let mx = -9999, my = -9999, ink = '#14140e', accent = '#ff5b2e';

    const colors = () => {
      const cs = getComputedStyle(document.body);
      ink = cs.getPropertyValue('--ink').trim() || ink;
      accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || accent;
    };
    const layout = () => {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (let y = GAP / 2; y < h; y += GAP) for (let x = GAP / 2; x < w; x += GAP) dots.push({ x, y, ox: x, oy: y, vx: 0, vy: 0 });
    };
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        const dx = mx - d.ox, dy = my - d.oy, dist = Math.hypot(dx, dy);
        const pull = dist < R ? (1 - dist / R) ** 2 : 0;
        const breathe = reduce ? 0 : Math.sin(t / 1400 + d.ox / 120 + d.oy / 160) * 1.2;
        const tx = d.ox + dx * pull * 0.28, ty = d.oy + dy * pull * 0.28 + breathe;
        d.vx = (d.vx + (tx - d.x) * 0.12) * 0.78; // spring
        d.vy = (d.vy + (ty - d.y) * 0.12) * 0.78;
        d.x += d.vx; d.y += d.vy;
        ctx.globalAlpha = 0.16 + pull * 0.7;
        ctx.fillStyle = pull > 0.15 ? accent : ink;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.1 + pull * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    const loop = (t: number) => { draw(t); if (visible) raf = requestAnimationFrame(loop); };

    colors(); layout(); draw(0);
    const ro = new ResizeObserver(() => { layout(); draw(performance.now()); });
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !reduce;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(loop);
    });
    io.observe(cv);
    const onMove = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
    const onLeave = () => { mx = my = -9999; };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    // Re-read colours when the theme or accent changes.
    const mo = new MutationObserver(() => { colors(); if (!visible) draw(0); });
    mo.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect(); window.removeEventListener('pointermove', onMove); document.removeEventListener('pointerleave', onLeave); };
  }, []);

  return <canvas ref={ref} className="pf-field" aria-hidden="true" />;
}
