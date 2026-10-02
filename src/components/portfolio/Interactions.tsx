'use client';
import { useEffect, useRef } from 'react';

const MAGNETIC = '.btn, .nav-cta, .link-pill, .pf-filter, [data-magnetic]';
const CLICKABLE = 'a, button, [role="button"], [data-cursor]';

// Cursor ring + magnetic buttons. Desktop pointers only; off for reduced motion.
export default function Interactions() {
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ring.current!;
    const label = el.firstElementChild as HTMLSpanElement;
    let x = -100, y = -100, tx = -100, ty = -100, raf = 0;
    let mag: HTMLElement | null = null;
    // Spring state per magnetic element: released ones keep bouncing until they settle.
    const springs = new Map<HTMLElement, { x: number; y: number; vx: number; vy: number; tx: number; ty: number }>();

    const loop = () => {
      x += (tx - x) * 0.22; y += (ty - y) * 0.22;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      springs.forEach((s, m) => {
        s.vx = (s.vx + (s.tx - s.x) * 0.2) * 0.72;
        s.vy = (s.vy + (s.ty - s.y) * 0.2) * 0.72;
        s.x += s.vx; s.y += s.vy;
        m.style.translate = `${s.x.toFixed(2)}px ${s.y.toFixed(2)}px`;
        if (m !== mag && Math.abs(s.x) + Math.abs(s.y) + Math.abs(s.vx) + Math.abs(s.vy) < 0.05) { m.style.translate = ''; springs.delete(m); }
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const spring = (m: HTMLElement) => { let s = springs.get(m); if (!s) { s = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 }; springs.set(m, s); } return s; };
    const release = () => { if (mag) { const s = spring(mag); s.tx = 0; s.ty = 0; mag = null; } };

    const onMove = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY;
      const t = e.target as HTMLElement;
      const hit = t.closest<HTMLElement>(CLICKABLE);
      const text = t.closest<HTMLElement>('[data-cursor]')?.dataset.cursor;
      el.classList.toggle('over', !!hit);
      el.classList.toggle('labelled', !!text);
      if (text && label.textContent !== text) label.textContent = text;

      const m = t.closest<HTMLElement>(MAGNETIC);
      if (m !== mag) { release(); mag = m; }
      if (mag) {
        const r = mag.getBoundingClientRect(), s = spring(mag);
        const dx = e.clientX - (r.left - s.x + r.width / 2), dy = e.clientY - (r.top - s.y + r.height / 2);
        s.tx = Math.max(-10, Math.min(10, dx * 0.25));
        s.ty = Math.max(-8, Math.min(8, dy * 0.3));
      }
    };
    const onDown = () => el.classList.add('down');
    const onUp = () => el.classList.remove('down');
    const onLeave = () => { tx = ty = -100; release(); };

    document.documentElement.classList.add('has-ring');
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf); springs.forEach((_, m) => { m.style.translate = ''; });
      document.documentElement.classList.remove('has-ring');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return <div ref={ring} className="pf-ring" aria-hidden="true"><span /></div>;
}
