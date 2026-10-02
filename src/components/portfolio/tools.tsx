'use client';
import { useEffect, useRef, useState } from 'react';
import { useHighlight } from './highlight';

// Each chip = brand mark + one small effect that is a joke about what the tool
// does. Effects are built from a few reusable overlays (orbit, ring, shine…)
// plus a speech bubble; all motion lives in globals.css under `.pf-tool`.

type Overlay = 'orbit' | 'orbit3' | 'ring' | 'shine' | 'pass' | 'box' | 'ripple';

const OVERLAY: Record<string, Overlay> = {
  node: 'orbit', langgraph: 'orbit3', twilio: 'ring', sarvamai: 'ring', redis: 'ring',
  next: 'shine', aws: 'shine', express: 'pass', htmlcss: 'box', materialui: 'ripple',
};

// Bubble text. `typed: true` reveals it like terminal output.
const BUBBLE: Record<string, { text: React.ReactNode; typed?: boolean; delay?: number }> = {
  express: { text: 'GET /work → 200 OK', delay: 550 },
  nest: { text: '@Injectable()', typed: true },
  next: { text: 'prefetched /work', delay: 300 },
  tailwind: { text: 'rounded-full shadow-lg ring-sky', typed: true },
  reactnative: { text: 'iOS ⇄ Android' },
  langchain: { text: 'prompt | llm | parser', typed: true },
  langgraph: { text: 'agent ⟲ tools → END', typed: true },
  chromadb: { text: 'top_k=3 · similarity 0.91', delay: 500 },
  deepgram: { text: '“…can you hear me?”', typed: true },
  sarvamai: { text: <span className="pf-swap"><span>नमस्ते</span><span>Hello</span></span> },
  twilio: { text: 'ringing… picked up ✓', typed: true },
  postgresql: { text: 'EXPLAIN → index scan ✓', typed: true },
  redis: { text: 'cache hit · 0.2ms' },
  sequelize: { text: 'User.findAll() → SELECT …', typed: true },
  sqlalchemy: { text: 'session.scalars(select(User))', typed: true },
  aws: { text: 'ap-south-1 · healthy', delay: 300 },
  ec2s3rds: { text: '3/3 instances running', delay: 650 },
  lambdasqs: { text: 'λ invoked · queue drained', delay: 600 },
  elasticbeanstalk: { text: 'env health: Green', delay: 600 },
  docker: { text: 'docker compose up ✓', typed: true },
  cicd: { text: 'build ✓  test ✓  deploy ✓', typed: true },
  git: { text: 'feature ⇢ main', delay: 350 },
  linux: { text: '$ ssh prod · uptime ✓', typed: true },
};

// ── Claude Code + Codex get a mini terminal ─────────────────────────────

const SPIN = ['✻', '✽', '✶', '✳', '✢', '·'];

// Milliseconds since mount; the terminals mount fresh on every hover.
function useTicker(ms: number) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => setT(performance.now() - start), ms);
    return () => clearInterval(id);
  }, [ms]);
  return t;
}

function ClaudeTerm() {
  const t = useTicker(90);
  const todo = (label: string, at: number) => (
    <div className={'pt-line' + (t > at ? ' done' : '')}>{t > at ? '☒' : '☐'} {label}</div>
  );
  return (
    <div className="pf-term" aria-hidden="true">
      <div className="pt-head"><span>claude</span><span>~/settings</span></div>
      <div className="pt-line pt-cmd">&gt; add dark mode to settings</div>
      {t > 350 && t < 1300 && <div className="pt-line pt-spin">{SPIN[Math.floor(t / 110) % SPIN.length]} Thinking…</div>}
      {t > 1300 && <>{todo('read theme tokens', 1550)}{todo('add the toggle', 1850)}{todo('run the tests', 2200)}</>}
      {t > 2450 && <div className="pt-line pt-ok">✓ Edited 3 files <span className="add">+12</span> <span className="del">−3</span></div>}
    </div>
  );
}

function CodexTerm() {
  const t = useTicker(90);
  const task = (label: string, dur: number, done: string) => {
    const p = Math.min(1, t / dur);
    return (
      <div className="pt-task">
        <span>{label}</span>
        <span className="pt-bar"><i style={{ transform: `scaleX(${p})` }} /></span>
        <span className={'pt-state' + (p >= 1 ? ' ok' : '')}>{p >= 1 ? done : 'running'}</span>
      </div>
    );
  };
  return (
    <div className="pf-term" aria-hidden="true">
      <div className="pt-head"><span>codex</span><span>3 tasks · sandbox</span></div>
      {task('fix flaky test', 1100, 'PR ready')}
      {task('bump deps', 1900, 'PR ready')}
      {task('add e2e: checkout', 1500, 'tests ✓')}
      {t > 2100 && <div className="pt-line">Allow <code>npm test</code>? [y/n] <span className="add">y</span></div>}
    </div>
  );
}

export function ToolChip({ name, years, k, icon, brand, dark }: { name: string; years: number; k: string; icon: React.ReactNode; brand: string; dark: boolean }) {
  const { project, setTool } = useHighlight();
  const [on, setOn] = useState(false);
  const [runs, setRuns] = useState(0); // remounts one-shot effects on each hover
  const ref = useRef<HTMLButtonElement>(null);
  const tap = useRef<ReturnType<typeof setTimeout>>(undefined);
  const term = k === 'claudecode' || k === 'codex';
  const related = !!project?.includes(k);
  const overlay = OVERLAY[k];
  const bubble = BUBBLE[k];

  const enter = () => { if (!on) setRuns((r) => r + 1); setOn(true); setTool(k); };
  const leave = () => { setOn(false); setTool(null); };
  const origin = (e: React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--rx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--ry', `${e.clientY - r.top}px`);
  };

  // Keep pop-ups inside the viewport on narrow screens.
  useEffect(() => {
    if (!on || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const w = term ? Math.min(280, window.innerWidth - 24) : 220;
    const center = r.left + r.width / 2;
    const shift = Math.max(12 + w / 2, Math.min(window.innerWidth - 12 - w / 2, center)) - center;
    ref.current.style.setProperty('--shift', `${shift}px`);
  }, [on, term]);

  return (
    <button
      ref={ref}
      type="button"
      data-t={k}
      data-dark={dark || undefined}
      style={{ '--brand': brand } as React.CSSProperties}
      className={'pf-tool' + (on ? ' on' : '') + (related ? ' related' : '') + (term ? ' has-term' : '')}
      aria-label={`${name}, ${years} ${years === 1 ? 'year' : 'years'}`}
      onMouseEnter={(e) => { origin(e); enter(); }}
      onMouseLeave={leave}
      onFocus={enter}
      onBlur={leave}
      onPointerDown={origin}
      onPointerUp={(e) => {
        // Touch has no hover: a tap plays the effect for a moment.
        if (e.pointerType === 'mouse') return;
        clearTimeout(tap.current);
        enter();
        tap.current = setTimeout(leave, term ? 3600 : 2200);
      }}
    >
      <span className="pf-fx" key={on ? `on${runs}` : 'off'}>
        {icon}
        {overlay && <span className={`pf-ov pf-ov-${overlay}`} aria-hidden="true">{overlay === 'orbit3' || overlay === 'box' ? <><i /><i /><i /></> : <i />}</span>}
      </span>
      <span className="pf-tool-name">
        {k === 'windsurf' || k === 'kiro'
          ? <><span>{name.slice(0, 2)}</span><span className="ghost">{name.slice(2)}</span></>
          : name}
      </span>
      <span className="pf-tool-yrs">{years}y</span>
      {k === 'django' && <span className="pf-runner" aria-hidden="true">🐎</span>}
      {bubble && (
        <span className={'pf-bubble' + (bubble.typed ? ' typed' : '')} style={{ '--bd': `${bubble.delay ?? 0}ms` } as React.CSSProperties} aria-hidden="true">
          <span key={on ? `b${runs}` : 'off'}>{bubble.text}</span>
        </span>
      )}
      {term && <span className="pf-term-wrap">{on && (k === 'claudecode' ? <ClaudeTerm /> : <CodexTerm />)}</span>}
    </button>
  );
}
