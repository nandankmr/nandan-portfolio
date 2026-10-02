import { LOGOS } from './logos';

// Real brand marks where an openly licensed one exists; small custom glyphs
// for the rest (AWS service groups, Chroma, Sarvam). Server-rendered so the
// path data ships as HTML, not as client JavaScript.
const S = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="pf-logo pf-glyph" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p} />
);

const GLYPHS: Record<string, React.ReactNode> = {
  chromadb: <S>{[[5, 6], [18, 5], [4, 17], [19, 18], [12, 3], [12, 20]].map(([x, y], i) => <circle key={i} className="pt" cx={x} cy={y} r="1.7" fill="currentColor" stroke="none" />)}<circle className="q" cx="12" cy="12" r="2.1" fill="var(--accent)" stroke="none" /></S>,
  sarvamai: <S><path d="M4 9.5v5M8 7v10M12 4.5v15M16 7v10M20 9.5v5" className="bars" /></S>,
  ec2s3rds: <S>{[2.5, 9.5, 16.5].map((x) => <rect key={x} className="vm" x={x} y="7" width="5" height="10" rx="1.2" />)}</S>,
  lambdasqs: <S><path className="lam" d="M5 4h3.5l8 16M12 11.5L7 20" /><g className="msgs">{[0, 1, 2].map((i) => <rect key={i} x={13.5 + i * 3.6} y="3.5" width="2.6" height="2.6" rx=".6" fill="currentColor" stroke="none" />)}</g></S>,
  elasticbeanstalk: <S><g className="stalk"><path d="M12 21.5c0-4.5 2.6-5.5 2.6-9.5S12 7 12 3" /><path d="M12.6 16.2c-2.6-.4-4.2-2-4.2-3.7 2.1 0 3.7 1.2 4.2 3.7z" fill="currentColor" /><path d="M14.4 10.2c2.5-.4 3.8-1.9 3.8-3.5-2 0-3.4 1.1-3.8 3.5z" fill="currentColor" /><path d="M12.2 5.4c-1.7-.2-2.8-1.2-2.8-2.4 1.4 0 2.4.8 2.8 2.4z" fill="currentColor" /></g></S>,
};

export function ToolIcon({ k }: { k: string }) {
  const logo = LOGOS[k];
  if (!logo) return <>{GLYPHS[k] ?? null}</>;
  return (
    <svg viewBox={logo.vb} className="pf-logo" fill="currentColor" aria-hidden="true">
      {logo.d.map((d, i) => <path key={i} d={d} fillRule={logo.evenodd ? 'evenodd' : undefined} clipRule={logo.evenodd ? 'evenodd' : undefined} />)}
    </svg>
  );
}

export function brandOf(k: string) {
  const l = LOGOS[k];
  return { brand: l?.hex ?? 'var(--accent)', dark: !!l?.dark };
}
