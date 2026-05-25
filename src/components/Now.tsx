'use client';
import { useEffect, useRef, useState } from 'react';
import { SITE } from '@/lib/data';

function formatIST() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 3600 * 1000);
  return ist.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function LiveClock() {
  const [t, setT] = useState('');
  useEffect(() => {
    setT(formatIST());
    const id = setInterval(() => setT(formatIST()), 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>
      {t} {SITE.timezone}
    </span>
  );
}

function CountStat({ target, suffix = '', label }: { target: number; suffix?: string; label: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const dur = 900;
          const start = performance.now();
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            setN(Math.round(target * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [target]);

  return (
    <div ref={ref} data-reveal>
      <div className="stat-num"><span className="accent">{n}</span>{suffix}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Now() {
  return (
    <section id="now" className="now">
      <div className="container">
        <div className="section-eyebrow" data-reveal>· About / Now</div>
        <div className="grid">
          <div>
            <h2 data-reveal>
              Engineer first, agent-builder second. I write systems that earn their keep.
            </h2>
            <p className="now-bio" data-reveal style={{ '--rev-delay': '120ms', marginTop: 24 } as React.CSSProperties}>
              Six years of shipping production code across SaaS, fintech, and ed-tech. I moved from
              typical full-stack work into agentic AI in 2024 — building voice agents, multi-agent
              booking flows, and the unglamorous infrastructure that holds them together. I read
              source code for fun, mentor six engineers, and have a strong preference for boring tech
              that doesn&apos;t surprise anyone at 3am.
            </p>
            <p className="now-bio" data-reveal style={{ '--rev-delay': '200ms', marginTop: 18 } as React.CSSProperties}>
              MCA from Jain University. Currently full-stack AI engineer at{' '}
              <strong style={{ color: 'var(--accent)', fontWeight: 500 }}>Crownstack Technologies</strong>.
            </p>
          </div>

          <div className="now-list" data-reveal style={{ '--rev-delay': '160ms' } as React.CSSProperties}>
            <div className="now-item">
              <span className="now-item-label">Currently</span>
              <span className="now-item-value">AI engineer at <span className="accent">Crownstack</span> — building agentic systems</span>
            </div>
            <div className="now-item">
              <span className="now-item-label">Based</span>
              <span className="now-item-value">{SITE.location} · <LiveClock /></span>
            </div>
            <div className="now-item">
              <span className="now-item-label">Reading</span>
              <span className="now-item-value">The LangChain source so you don&apos;t have to</span>
            </div>
            <div className="now-item">
              <span className="now-item-label">Shipped</span>
              <span className="now-item-value"><span className="accent">10+</span> production products across fintech, SaaS &amp; AI</span>
            </div>
            <div className="now-item">
              <span className="now-item-label">Open to</span>
              <span className="now-item-value">Senior / staff IC roles · remote-first preferred</span>
            </div>
          </div>
        </div>

        <div className="stats">
          <CountStat target={6} suffix="+" label="Years shipping prod" />
          <CountStat target={10} suffix="+" label="Production products" />
          <CountStat target={6} label="Engineers mentored" />
          <CountStat target={5} suffix="+" label="AI agents built" />
        </div>
      </div>
    </section>
  );
}
