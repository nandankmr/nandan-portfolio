import { FEATURED, PROJECTS, SITE } from '@/lib/data';

function FakeTranscript() {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.65, color: 'var(--ink)', height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        <span>● Live · 02:14</span>
        <span>recruiter-ai // call #14829</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { role: 'AGENT', text: "Thanks for picking up. Quick five-minute screen — sound good?", muted: false },
          { role: 'CANDIDATE', text: 'Sure, go ahead.', muted: true },
          { role: 'AGENT', text: "You've shipped Node services at scale before — walk me through the worst on-call you've had.", muted: false },
          { role: 'CANDIDATE', text: 'The Redis incident at — sorry, can you hear me?', muted: true },
          { role: 'AGENT', text: 'Loud and clear. Take your time.', muted: false },
        ].map((b, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span style={{ minWidth: 76, color: 'var(--accent)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{b.role}</span>
            <span style={{ color: b.muted ? 'var(--muted)' : 'var(--ink)' }}>{b.text}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 10 }}>
        <span>STT: deepgram · TTS: sarvam</span>
        <span style={{ color: 'var(--accent)' }}>conf: 0.94 ↗</span>
      </div>
    </div>
  );
}

export default function Work() {
  return (
    <section id="work">
      <div className="container">
        <div className="section-eyebrow" data-reveal>· Selected work — 2022 → now</div>
        <div className="work-head">
          <h2 data-reveal>
            Things I&apos;ve shipped to production — and what I learned from each.
          </h2>
          <a href={`https://${SITE.github}`} target="_blank" rel="noreferrer" className="link-pill" data-reveal>All repos ↗</a>
        </div>

        {/* Featured */}
        <article className="featured" data-reveal>
          <div>
            <div className="featured-meta">{FEATURED.index} · Featured · {FEATURED.year} · {FEATURED.tag}</div>
            <h3>{FEATURED.name} <span className="featured-tag">/ {FEATURED.role}</span></h3>
            <p className="featured-summary">{FEATURED.summary}</p>
            <ul className="featured-bullets">
              {FEATURED.bullets.map((b) => <li key={b}>{b}</li>)}
            </ul>
            <div className="featured-chips">
              {FEATURED.stack.map((s) => <span className="chip" key={s}>{s}</span>)}
            </div>
            <div className="featured-links">
              {FEATURED.links.map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="link-pill">{l.label} ↗</a>
              ))}
            </div>
          </div>
          <div className="featured-visual">
            <FakeTranscript />
          </div>
        </article>

        {/* Grid */}
        <div className="work-grid">
          {PROJECTS.map((p, i) => (
            <article key={p.id} className="proj-card" data-reveal style={{ '--rev-delay': `${i * 60}ms` } as React.CSSProperties}>
              <div className="proj-top">
                <span className="proj-year">{p.year} · {p.tag}</span>
                <span className="proj-arrow">↗</span>
              </div>
              <h3>{p.name}</h3>
              <p className="proj-desc">{p.desc}</p>
              <div className="proj-chips">
                {p.stack.map((s) => <span className="chip" key={s}>{s}</span>)}
              </div>
              {p.links.length > 0 && (
                <div style={{ display: 'flex', gap: 14, marginTop: 'auto' }}>
                  {p.links.map((l) => (
                    <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="link-pill">{l.label} ↗</a>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
