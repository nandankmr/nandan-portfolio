'use client';
import { useEffect, useRef, useState } from 'react';
import { CAREER, EXPERIENCE, SITE } from '@/lib/data';

const LANE = { main: 14, side: 42 };

// Stable fake short-hash, so the log looks like a log.
function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

function Msg({ text }: { text: string }) {
  const i = text.indexOf(':');
  if (i < 0) return <span>{text}</span>;
  return <><span className="pf-ctype">{text.slice(0, i + 1)}</span><span>{text.slice(i + 1)}</span></>;
}

export default function GitGraph() {
  const listRef = useRef<HTMLOListElement>(null);
  const [geo, setGeo] = useState<{ h: number; ys: number[] } | null>(null);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState<string | null>(null);

  // Measure each commit's dot position so the graph lines meet the dots.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const items = Array.from(list.querySelectorAll<HTMLElement>('[data-dot]'));
      const top = list.getBoundingClientRect().top;
      setGeo({ h: list.scrollHeight, ys: items.map((d) => d.getBoundingClientRect().top - top + d.offsetHeight / 2) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, []);

  // Scroll-driven: the graph "draws" down to wherever the reader is, easing
  // toward the target instead of snapping to it.
  useEffect(() => {
    let raf = 0, cur = 0, target = 0;
    const read = () => {
      const list = listRef.current;
      if (!list) return;
      const r = list.getBoundingClientRect();
      target = Math.max(0, Math.min(1, (window.innerHeight * 0.62 - r.top) / r.height));
    };
    const tick = () => {
      cur += (target - cur) * 0.14;
      if (Math.abs(target - cur) < 0.0005) cur = target;
      setProgress(cur);
      if (cur !== target) raf = requestAnimationFrame(tick);
    };
    const onScroll = () => { read(); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  let paths: string[] = [];
  if (geo) {
    const { ys } = geo;
    const mainIdx = CAREER.map((c, i) => (c.lane === 'main' ? i : -1)).filter((i) => i >= 0);
    paths = [`M${LANE.main} ${ys[0]}V${ys[ys.length - 1]}`];
    CAREER.forEach((c, i) => {
      if (c.side !== 'open') return;
      const end = CAREER.findIndex((x, j) => j > i && x.side === 'merge');
      const fork = ys[[...mainIdx].reverse().find((m) => m < i) ?? 0];
      const join = ys[mainIdx.find((m) => m > end) ?? ys.length - 1];
      const a = ys[i], b = ys[end];
      paths.push(`M${LANE.main} ${fork}C${LANE.main} ${fork + 28} ${LANE.side} ${a - 28} ${LANE.side} ${a}V${b}C${LANE.side} ${b + 28} ${LANE.main} ${join - 28} ${LANE.main} ${join}`);
    });
  }
  const reachY = geo ? progress * geo.h : 0;

  return (
    <section id="career" className="pf-section">
      <div className="container">
        <div className="section-eyebrow" data-reveal>· Career — since the first commit</div>
        <div className="pf-head">
          <h2 className="pf-h2" data-reveal>Six years shipping. <span className="muted">Nearly nine of pushing to GitHub.</span></h2>
          <a href={SITE.resume} download className="link-pill" data-reveal>Full résumé ↓</a>
        </div>
        <div className="pf-cmd" data-reveal><span className="accent">$</span> git log --reverse --graph nandan</div>

        <div className="pf-log-wrap">
          {geo && (
            <svg className="pf-graph" width="56" height={geo.h} aria-hidden="true">
              <defs><clipPath id="pf-reach"><rect x="0" y="0" width="56" height={reachY} /></clipPath></defs>
              <g className="base">{paths.map((d) => <path key={d} d={d} />)}</g>
              <g className="lit" clipPath="url(#pf-reach)">{paths.map((d) => <path key={d} d={d} />)}</g>
              <text className="pf-lane-label" x={LANE.main} y={geo.ys[0] - 22} textAnchor="middle">main</text>
              {CAREER.map((c, i) => c.side === 'open' && (
                <text key={i} className="pf-lane-label side" x={LANE.side + 10} y={geo.ys[i] - 20}>side-projects</text>
              ))}
            </svg>
          )}
          <ol ref={listRef} className="pf-log">
            {CAREER.map((c) => {
              const job = c.job ? EXPERIENCE.find((e) => e.company === c.job) : undefined;
              const id = c.date + c.msg;
              const isOpen = open === id;
              const reached = !!geo && geo.ys[CAREER.indexOf(c)] <= reachY;
              return (
                <li key={id} className={`pf-commit lane-${c.lane}` + (reached ? ' reached' : '') + (c.head ? ' head' : '') + (job ? ' is-job' : '')}>
                  <span className="pf-dot" data-dot style={{ left: LANE[c.lane] } as React.CSSProperties} />
                  <div className="pf-commit-body">
                    <div className="pf-commit-meta">
                      <span className="pf-hash">{c.head ? 'HEAD' : hash(id)}</span>
                      <span>{c.date}</span>
                      {c.tag && <span className="pf-tag">{c.tag}</span>}
                      {c.lane === 'side' && <span className="pf-branch">side-projects</span>}
                    </div>
                    {job ? (
                      <button type="button" className="pf-commit-msg as-btn" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : id)} data-cursor={isOpen ? 'Collapse' : 'Expand'}>
                        <Msg text={c.msg} /> <span className="pf-commit-plus" aria-hidden="true" />
                      </button>
                    ) : (
                      <div className="pf-commit-msg"><Msg text={c.msg} /></div>
                    )}
                    {c.body && <p className="pf-commit-text">{c.body}</p>}
                    <pre className="pf-diff" aria-hidden="true">
                      <span className="h">commit {c.head ? 'HEAD' : hash(id)}{c.tag ? `  (tag: ${c.tag})` : ''}</span>{'\n'}
                      <span className="m">Date:   {c.date}</span>{'\n\n'}
                      {job ? (
                        <>
                          <span className="a">+ role: {job.role}</span>{'\n'}
                          <span className="a">+ stack: {job.stack.join(', ')}</span>{'\n'}
                          <span className="a">+ {job.points.length} things shipped</span>{'\n'}
                          <span className="c">~ {job.location}</span>
                        </>
                      ) : (
                        <span className="a">+ {c.body ?? c.msg}</span>
                      )}
                    </pre>
                    {job && (
                      <>
                        <p className="pf-commit-text">{job.role} · {job.period} · {job.location}</p>
                        <p className="pf-commit-about">{job.about}</p>
                        <div className={'pf-commit-more' + (isOpen ? ' open' : '')}>
                          <div>
                            <ul>{job.points.map((p) => <li key={p}>{p}</li>)}</ul>
                            <div className="pf-chips">{job.stack.map((s) => <span key={s} className="chip">{s}</span>)}</div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
