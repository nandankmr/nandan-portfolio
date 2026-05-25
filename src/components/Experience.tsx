import { EXPERIENCE, SITE } from '@/lib/data';

export default function Experience() {
  return (
    <section id="experience" className="experience">
      <div className="container">
        <div className="section-eyebrow" data-reveal>· Experience — 2020 → now</div>
        <div className="work-head">
          <h2 data-reveal>
            Six years across <span style={{ color: 'var(--accent)' }}>EdTech, FinTech, SaaS</span> &amp; AI — four teams, mostly senior.
          </h2>
          <a href={SITE.resume} download className="link-pill" data-reveal>Full résumé ↓</a>
        </div>

        <ol className="timeline">
          {EXPERIENCE.map((job, i) => (
            <li key={job.company} className="timeline-item" data-reveal style={{ '--rev-delay': `${i * 80}ms` } as React.CSSProperties}>
              <div className="timeline-period">
                <span className="timeline-dot" aria-hidden="true" />
                <span className="timeline-period-text">{job.period}</span>
                <span className="timeline-loc">{job.location}</span>
              </div>
              <div className="timeline-body">
                <div className="timeline-head">
                  <h3>
                    <span className="timeline-role">{job.role}</span>
                    <span className="timeline-at"> at </span>
                    <span className="timeline-co">{job.company}</span>
                  </h3>
                  <span className="timeline-kind">{job.kind}</span>
                </div>
                <ul className="timeline-points">
                  {job.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
                <div className="timeline-stack">
                  {job.stack.map((s) => <span key={s} className="chip">{s}</span>)}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
