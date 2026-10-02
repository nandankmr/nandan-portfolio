'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { SITE } from '@/lib/data';
import { blogUrl } from '@/lib/blog/urls';
import HeroField from './HeroField';
import { Cycler } from './Scramble';

const NAME = ['Nandan', 'Kumar'];
const LEAD = 'I build AI systems that';
// Things the agents on this page actually do.
const DOES = ['pick up the phone.', 'book the tickets.', 'grade the interviews.'];
const LEAD2 = 'And the unglamorous infrastructure that keeps them honest.';

function istNow() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
}
const everyTwentySeconds = (cb: () => void) => { const id = setInterval(cb, 20000); return () => clearInterval(id); };

// Noida time, "HH:MM". Empty on the server so hydration never mismatches.
export function useIstClock() {
  return useSyncExternalStore(everyTwentySeconds, istNow, () => '');
}

function Count({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / 1100);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{n}{suffix}</span>;
}

export default function Hero({ onPalette }: { onPalette: () => void }) {
  const nameRef = useRef<HTMLHeadingElement>(null);
  const time = useIstClock();

  // Letters thicken as the cursor nears them (variable font weight).
  useEffect(() => {
    const h = nameRef.current;
    if (!h || window.matchMedia('(prefers-reduced-motion: reduce), (hover: none)').matches) return;
    const letters = Array.from(h.querySelectorAll<HTMLElement>('.pf-l'));
    let raf = 0, mx = -9999, my = -9999;
    const paint = () => {
      const base = Number(getComputedStyle(h).fontWeight) || 420; // themes set their own weight
      for (const l of letters) {
        const r = l.getBoundingClientRect();
        const d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
        const k = Math.max(0, 1 - d / 280);
        l.style.fontWeight = k < 0.02 ? '' : String(Math.round(base + (900 - base) * k * k));
      }
    };
    const onMove = (e: PointerEvent) => { mx = e.clientX; my = e.clientY; cancelAnimationFrame(raf); raf = requestAnimationFrame(paint); };
    const onLeave = () => { mx = my = -9999; cancelAnimationFrame(raf); raf = requestAnimationFrame(paint); };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => { window.removeEventListener('pointermove', onMove); document.removeEventListener('pointerleave', onLeave); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section id="home" className="pf-hero">
      <HeroField />
      <div className="container">
        <div className="pf-status pf-enter">
          <span className="pf-live" aria-hidden="true" />
          Open to senior / staff IC roles · remote-first
        </div>

        <h1 ref={nameRef} className="pf-name" aria-label="Nandan Kumar">
          {NAME.map((w, wi) => (
            <span key={w} className="pf-word" aria-hidden="true">
              {[...w].map((ch, i) => (
                <span key={i} className="pf-l" style={{ '--d': `${(wi * 6 + i) * 45}ms` } as React.CSSProperties}>{ch}</span>
              ))}
              {wi === 1 && <span className="pf-l accent" style={{ '--d': '520ms' } as React.CSSProperties}>.</span>}
            </span>
          ))}
        </h1>

        <p className="pf-lead">
          {LEAD.split(' ').map((w, i) => (
            <span key={i} className="pf-wm"><span style={{ '--d': `${300 + i * 40}ms` } as React.CSSProperties}>{w}</span> </span>
          ))}
          <span className="pf-wm"><span className="accent" style={{ '--d': '540ms' } as React.CSSProperties}><Cycler phrases={DOES} /></span></span>
        </p>
        <p className="pf-lead pf-lead-2">
          {LEAD2.split(' ').map((w, i) => (
            <span key={i} className="pf-wm"><span style={{ '--d': `${560 + i * 24}ms` } as React.CSSProperties}>{w}</span> </span>
          ))}
        </p>

        <p className="pf-sub pf-enter" style={{ '--rev-delay': '420ms' } as React.CSSProperties}>
          Senior full-stack &amp; AI engineer — six years across EdTech, FinTech and SaaS. Now building voice agents and
          multi-agent booking flows at <strong>Crownstack</strong>.
        </p>

        <div className="pf-ctas pf-enter" style={{ '--rev-delay': '500ms' } as React.CSSProperties}>
          <a href="#work" className="btn btn-primary">See the work <span className="btn-arrow">↘</span></a>
          <a href={blogUrl()} className="btn">Read the blog <span className="btn-arrow">↗</span></a>
          <a href={SITE.resume} download className="btn">Résumé <span className="btn-arrow">↓</span></a>
          <button type="button" className="btn pf-k" onClick={onPalette} aria-label="⌘K, open command palette"><kbd>⌘</kbd><kbd>K</kbd></button>
        </div>

        <dl className="pf-now pf-enter" style={{ '--rev-delay': '580ms' } as React.CSSProperties}>
          <div><dt>Currently</dt><dd>AI engineer, <span className="accent">Crownstack</span></dd></div>
          <div><dt>Local time</dt><dd>{time || '··:··'} IST · Noida</dd></div>
          <div><dt>Reading</dt><dd>The LangChain source, so you don&apos;t have to</dd></div>
          <div><dt>Training</dt><dd>MCA, Jain University</dd></div>
        </dl>

        <div className="pf-stats pf-enter" style={{ '--rev-delay': '660ms' } as React.CSSProperties}>
          <div><b><Count to={6} suffix="+" /></b><span>years shipping prod</span></div>
          <div><b><Count to={10} suffix="+" /></b><span>production products</span></div>
          <div><b><Count to={6} /></b><span>engineers led</span></div>
          <div><b><Count to={5} suffix="+" /></b><span>AI agents built</span></div>
        </div>
      </div>
    </section>
  );
}
