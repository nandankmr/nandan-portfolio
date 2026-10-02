'use client';
import { useEffect, useRef } from 'react';

// A big outlined line before Contact. Scroll moves it; scroll *speed* skews it.
export default function Kinetic() {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current!;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0, last = window.scrollY, skew = 0, visible = false;
    const tick = () => {
      const y = window.scrollY, v = y - last;
      last = y;
      skew += (Math.max(-12, Math.min(12, v * 0.35)) - skew) * 0.12;
      const half = el.scrollWidth / 2;
      const x = -((y * 0.45) % half);
      el.style.transform = `translate3d(${x}px, 0, 0) skewX(${-skew}deg)`;
      if (visible) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) { last = window.scrollY; raf = requestAnimationFrame(tick); }
    });
    io.observe(el.parentElement!);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  const line = (
    <span>Let&apos;s build something that earns its keep <i>✦</i> </span>
  );
  return (
    <div className="pf-kinetic" aria-hidden="true">
      <div ref={track} className="pf-kinetic-track">{line}{line}{line}{line}</div>
    </div>
  );
}
