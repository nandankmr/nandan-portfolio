// Looping mini-demos shown beside the cursor when a work row is hovered.
// Pure SVG + CSS keyframes (globals.css, `.pv-*`); numbers are illustrative.
const T = (p: React.SVGProps<SVGTextElement>) => <text fontFamily="var(--font-mono)" fontSize="11" fill="currentColor" {...p} />;

function Recruiter() {
  return (
    <svg viewBox="0 0 320 200" className="pv pv-rec">
      <g className="ring"><rect x="18" y="20" width="26" height="40" rx="6" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="31" cy="53" r="2" fill="currentColor" /></g>
      <T x="56" y="36" opacity=".6">calling candidate…</T>
      <T x="56" y="54" fill="var(--accent)">● live 02:14</T>
      <g className="bars">{Array.from({ length: 22 }, (_, i) => <rect key={i} x={186 + i * 5.5} y="26" width="3" height="30" rx="1.5" fill="var(--accent)" style={{ '--i': i } as React.CSSProperties} />)}</g>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} className="tx" style={{ '--i': i } as React.CSSProperties}>
          <T x="18" y={92 + i * 22} opacity=".55">{i % 2 ? 'CANDIDATE' : 'AGENT'}</T>
          <rect x="102" y={84 + i * 22} height="8" rx="4" fill="currentColor" opacity={i % 2 ? 0.25 : 0.6} width={[150, 90, 180, 120][i]} />
        </g>
      ))}
      <g className="score"><rect x="206" y="166" width="96" height="22" rx="11" fill="var(--accent)" /><T x="254" y="181" textAnchor="middle" fill="#fff">fit · 0.94</T></g>
    </svg>
  );
}

function Booking() {
  return (
    <svg viewBox="0 0 320 200" className="pv pv-book">
      <g className="b1"><rect x="16" y="16" width="176" height="28" rx="14" fill="currentColor" opacity=".12" /><T x="30" y="34">2 seats, Friday night?</T></g>
      <g className="b2"><rect x="174" y="52" width="130" height="28" rx="14" fill="var(--accent)" /><T x="188" y="70" fill="#fff">Row F works →</T></g>
      {Array.from({ length: 4 }, (_, r) => Array.from({ length: 10 }, (_, c) => {
        const pick = r === 2 && (c === 4 || c === 5);
        return <rect key={`${r}${c}`} className={pick ? 'seat pick' : 'seat'} x={52 + c * 22} y={98 + r * 18} width="16" height="12" rx="3" fill={pick ? 'var(--accent)' : 'currentColor'} opacity={pick ? 1 : 0.18} style={{ '--i': c } as React.CSSProperties} />;
      }))}
      <g className="done"><T x="160" y="190" textAnchor="middle" fill="var(--accent)">booked ✓  F5 · F6</T></g>
    </svg>
  );
}

function Verify() {
  return (
    <svg viewBox="0 0 320 200" className="pv pv-ver">
      <rect x="90" y="12" width="140" height="176" rx="8" fill="none" stroke="currentColor" strokeWidth="2" opacity=".5" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i} style={{ '--i': i } as React.CSSProperties}>
          <rect x="108" y={36 + i * 22} width={[80, 96, 64, 90, 72, 84][i]} height="7" rx="3.5" fill="currentColor" opacity=".3" />
          <path className="tick" d={`M210 ${37 + i * 22}l4 4 7-8`} stroke="var(--accent)" strokeWidth="2.2" fill="none" />
        </g>
      ))}
      <rect className="scan" x="92" y="20" width="136" height="3" fill="var(--accent)" opacity=".7" />
      <g className="stamp"><g transform="rotate(-12 160 120)"><rect x="104" y="100" width="112" height="40" rx="4" fill="none" stroke="var(--accent)" strokeWidth="3" /><T x="160" y="126" textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--accent)">VERIFIED</T></g></g>
    </svg>
  );
}

function Reports() {
  return (
    <svg viewBox="0 0 320 200" className="pv pv-rep">
      <path d="M24 160h170" stroke="currentColor" opacity=".4" />
      {[60, 95, 75, 120, 140].map((h, i) => <rect key={i} className="bar" x={34 + i * 32} y={160 - h} width="20" height={h} rx="3" fill={i === 4 ? 'var(--accent)' : 'currentColor'} opacity={i === 4 ? 1 : 0.35} style={{ '--i': i } as React.CSSProperties} />)}
      <path className="line" pathLength={1} d="M30 120L68 96L100 108L132 70L168 44" stroke="var(--accent)" strokeWidth="2.5" fill="none" />
      <g className="file f1"><rect x="222" y="54" width="76" height="40" rx="6" fill="currentColor" opacity=".12" /><T x="260" y="79" textAnchor="middle" fontWeight="700">.PPT</T></g>
      <g className="file f2"><rect x="222" y="106" width="76" height="40" rx="6" fill="var(--accent)" /><T x="260" y="131" textAnchor="middle" fontWeight="700" fill="#fff">.PDF</T></g>
    </svg>
  );
}

function Rewrite() {
  return (
    <svg viewBox="0 0 320 200" className="pv pv-rw">
      <path d="M70 150a90 90 0 0 1 180 0" fill="none" stroke="currentColor" strokeWidth="10" opacity=".12" />
      <path className="arc" pathLength={1} d="M70 150a90 90 0 0 1 180 0" fill="none" stroke="var(--accent)" strokeWidth="10" />
      <g className="needle"><path d="M160 150L160 74" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /><circle cx="160" cy="150" r="7" fill="currentColor" /></g>
      <T x="62" y="176" opacity=".6">old stack</T><T x="258" y="176" textAnchor="end" fill="var(--accent)">rewrite</T>
      <T x="160" y="194" textAnchor="middle" opacity=".6">page load</T>
    </svg>
  );
}

function Threads() {
  return (
    <svg viewBox="0 0 320 200" className="pv pv-thr">
      {['main', 'worker 1', 'worker 2', 'worker 3'].map((l, i) => (
        <g key={l}>
          <T x="16" y={44 + i * 40} opacity=".55">{l}</T>
          <path d={`M88 ${40 + i * 40}H304`} stroke="currentColor" opacity=".15" strokeWidth="14" strokeLinecap="round" />
          {i > 0 && <rect className="job" x="88" y={33 + i * 40} width="54" height="14" rx="7" fill={i === 1 ? 'var(--accent)' : 'currentColor'} opacity={i === 1 ? 1 : 0.55} style={{ '--d': `${1.2 + i * 0.5}s` } as React.CSSProperties} />}
        </g>
      ))}
      <T x="304" y="30" textAnchor="end" fill="var(--accent)">main: idle ✓</T>
    </svg>
  );
}

function Responsive() {
  return (
    <svg viewBox="0 0 320 200" className="pv pv-resp">
      <g className="wide">
        <rect x="40" y="20" width="240" height="160" rx="8" fill="none" stroke="currentColor" strokeWidth="2" opacity=".5" />
        <path d="M40 42h240" stroke="currentColor" opacity=".3" />
        <rect x="54" y="56" width="100" height="56" rx="4" fill="var(--accent)" opacity=".85" />
        <rect x="166" y="56" width="100" height="56" rx="4" fill="currentColor" opacity=".25" />
        <rect x="54" y="124" width="212" height="12" rx="4" fill="currentColor" opacity=".25" />
      </g>
      <g className="narrow">
        <rect x="118" y="10" width="84" height="180" rx="12" fill="none" stroke="currentColor" strokeWidth="2" opacity=".5" />
        <rect x="128" y="30" width="64" height="40" rx="4" fill="var(--accent)" opacity=".85" />
        <rect x="128" y="78" width="64" height="40" rx="4" fill="currentColor" opacity=".25" />
        <rect x="128" y="126" width="64" height="10" rx="4" fill="currentColor" opacity=".25" />
      </g>
    </svg>
  );
}

export const PREVIEWS: Record<string, () => React.ReactElement> = {
  'recruiter-ai': Recruiter,
  'ticket-booking': Booking,
  checkministry: Verify,
  avendus: Reports,
  districtd: Rewrite,
  rnd: Threads,
  proprofs: Responsive,
};
