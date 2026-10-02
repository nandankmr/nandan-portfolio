'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, ViewTransition } from 'react';
import { FEATURED, SITE } from '@/lib/data';
import Diagram from './Diagram';
import { useHighlight } from './highlight';
import { toolKey } from './keys';
import { PREVIEWS } from './previews';
import { WORK, type Kind } from './projects';

const FILTERS: ('All' | Kind)[] = ['All', 'AI', 'Fintech', 'SaaS', 'EdTech'];

export default function WorkIndex() {
  const [open, setOpen] = useState<string | null>(FEATURED.id);
  const [filter, setFilter] = useState<'All' | Kind>('All');
  const [hover, setHover] = useState<string | null>(null);
  const { tool, setProject } = useHighlight();
  const pvRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // The preview card trails the cursor (desktop only; touch never sets hover).
  useEffect(() => {
    if (!hover) return;
    let raf = 0;
    const tick = () => {
      const p = pos.current;
      p.x += (p.tx - p.x) * 0.18;
      p.y += (p.ty - p.y) * 0.18;
      if (pvRef.current) pvRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hover]);

  const fine = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const move = (e: React.MouseEvent) => {
    const w = 320, h = 210;
    // Keep clear of the titles on the left; flip to the cursor's left near the edge.
    let x = Math.max(e.clientX + 40, window.innerWidth * 0.56);
    if (x + w > window.innerWidth - 16) x = e.clientX - w - 40;
    const y = Math.min(window.innerHeight - h - 12, Math.max(12, e.clientY - h / 2));
    if (!hover) pos.current = { x, y, tx: x, ty: y };
    pos.current.tx = x;
    pos.current.ty = y;
  };

  const Preview = hover ? PREVIEWS[hover] : null;

  return (
    <section id="work" className="pf-section">
      <div className="container">
        <div className="section-eyebrow" data-reveal>· Selected work — 2021 → now</div>
        <div className="pf-head">
          <h2 className="pf-h2" data-reveal>Things I&apos;ve shipped to production.</h2>
          <div className="pf-filters" role="group" aria-label="Filter work" data-reveal>
            {FILTERS.map((f) => (
              <button key={f} type="button" aria-pressed={filter === f} className={'pf-filter' + (filter === f ? ' on' : '')} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>

        <ol className="pf-index" onMouseLeave={() => { setHover(null); setProject(null); }}>
          {WORK.map((r, i) => {
            const shown = filter === 'All' || r.kind === filter;
            const keys = r.stack.map(toolKey);
            const isOpen = open === r.id;
            return (
              <li
                key={r.id}
                className={'pf-row' + (shown ? '' : ' hidden') + (isOpen ? ' open' : '') + (tool && keys.includes(tool) ? ' related' : '') + (tool && !keys.includes(tool) ? ' dim' : '')}
                aria-hidden={!shown}
              >
                {/* Reveal lives on this static wrapper: the li's className changes on
                    open/hover, and React would wipe the reveal's added "in" class. */}
                <div className="pf-row-clip" data-reveal style={{ '--rev-delay': `${i * 50}ms` } as React.CSSProperties}>
                <button
                  type="button"
                  className="pf-row-head"
                  aria-expanded={isOpen}
                  tabIndex={shown ? 0 : -1}
                  data-cursor={isOpen ? 'Collapse' : 'Expand'}
                  onClick={() => setOpen(isOpen ? null : r.id)}
                  onMouseEnter={(e) => { if (fine()) { move(e); setHover(r.id); } setProject(keys); }}
                  onMouseMove={move}
                  onFocus={() => setProject(keys)}
                  onBlur={() => setProject(null)}
                >
                  <span className="pf-row-no">{String(i + 1).padStart(2, '0')}</span>
                  {/* Same name as the case-study title, so it morphs between pages. */}
                  <ViewTransition name={`work-${r.id}`} share="pf-morph"><span className="pf-row-name">{r.name}</span></ViewTransition>
                  <span className="pf-row-tag">{r.tag}</span>
                  <span className="pf-row-year">{r.year}</span>
                  <span className="pf-row-plus" aria-hidden="true" />
                </button>
                <div className="pf-row-body">
                  <div>
                    <div className="pf-row-inner">
                      <p className="pf-row-summary">{r.summary}</p>
                      {r.bullets && <ul className="pf-row-bullets">{r.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
                      {isOpen && <Diagram id={r.id} compact />}
                      <div className="pf-row-foot">
                        <div className="pf-chips">{r.stack.map((s) => <span key={s} className={'chip' + (tool === toolKey(s) ? ' lit' : '')}>{s}</span>)}</div>
                        <div className="pf-links">
                          {r.links.map((l) => <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="link-pill" data-cursor={l.label}>{l.label} ↗</a>)}
                          <Link href={`/work/${r.id}`} transitionTypes={['nav-forward']} className="link-pill pf-case-link" data-cursor="Open case study" data-magnetic>Case study →</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </li>
            );
          })}
        </ol>
        <a href={`https://${SITE.github}`} target="_blank" rel="noreferrer" className="link-pill pf-more" data-reveal>All repos on GitHub ↗</a>
      </div>

      <div ref={pvRef} className={'pf-preview' + (Preview ? ' show' : '')} aria-hidden="true">
        {Preview && <Preview key={hover} />}
      </div>
    </section>
  );
}
