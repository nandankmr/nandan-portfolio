'use client';
import { useEffect, useRef, useState } from 'react';

// A replayable, scroll-triggered lane: each stage lights in turn (CSS reads
// `--step`), and the stage bodies animate once their step is reached.
const STAGES = [
  { k: 'spec', t: 'Spec', d: 'I write the brief: the problem, the constraints, what done looks like.' },
  { k: 'claude', t: 'Claude Code', d: 'Plans it, edits the code, runs the tests — in my repo, on my branch.' },
  { k: 'codex', t: 'Codex', d: 'Takes the side quests in parallel: flaky tests, upgrades, the e2e nobody wrote.' },
  { k: 'review', t: 'Review', d: 'I read every diff. Agents write drafts; engineers own outcomes.' },
  { k: 'ship', t: 'Ship', d: 'CI goes green, it deploys, and I watch it in production.' },
];

function Body({ k }: { k: string }) {
  switch (k) {
    case 'spec':
      return <div className="hw-spec"><i /><i /><i /><i /></div>;
    case 'claude':
      return (
        <div className="hw-term">
          <div>&gt; implement the brief</div>
          <div className="hw-todo"><span>☒ plan</span><span>☒ edit 4 files</span><span>☒ tests pass</span></div>
        </div>
      );
    case 'codex':
      return <div className="hw-tasks">{[0, 1, 2].map((i) => <span key={i} style={{ '--i': i } as React.CSSProperties}><i /></span>)}</div>;
    case 'review':
      return (
        <div className="hw-diff">
          <div className="add">+ handle the empty state</div>
          <div className="del">− TODO: handle errors</div>
          <div className="add">+ retry with backoff</div>
        </div>
      );
    default:
      return <div className="hw-ship"><span>build ✓</span><span>test ✓</span><span>deploy ✓</span></div>;
  }
}

export default function HowIWork() {
  const ref = useRef<HTMLElement>(null);
  const [step, setStep] = useState(-1);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setRun((r) => r || 1); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!run) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ids = reduce
      ? [setTimeout(() => setStep(STAGES.length - 1), 0)]
      : STAGES.map((_, i) => setTimeout(() => setStep(i), 250 + i * 900));
    return () => ids.forEach(clearTimeout);
  }, [run]);

  return (
    <section id="how" ref={ref} className="pf-section">
      <div className="container">
        <div className="section-eyebrow" data-reveal>· How I work — AI-native, human-owned</div>
        <div className="pf-head">
          <h2 className="pf-h2" data-reveal>Agents do the typing. <span className="muted">I do the deciding.</span></h2>
          <button type="button" className="link-pill as-btn" onClick={() => { setStep(-1); setRun((r) => r + 1); }} data-reveal>↻ Replay</button>
        </div>
        <ol className="pf-lane" style={{ '--step': step } as React.CSSProperties}>
          {STAGES.map((s, i) => (
            <li key={s.k} className={'pf-stage stage-' + s.k + (i <= step ? ' on' : '') + (i === step ? ' is-now' : '')}>
              <span className="pf-stage-no">0{i + 1}</span>
              <h3>{s.t}</h3>
              <div className="pf-stage-vis" aria-hidden="true">{i <= step && <Body k={s.k} />}</div>
              <p>{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
