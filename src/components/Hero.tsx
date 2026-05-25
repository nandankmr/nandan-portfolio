import { SITE } from '@/lib/data';

export default function Hero() {
  return (
    <section id="home" className="hero">
      <div className="container">
        <div className="grid">
          <div>
            <div className="hero-status" data-reveal>
              <span className="dot" aria-hidden="true" />
              <span>Available · Open to senior / staff roles</span>
            </div>
            <h1 data-reveal style={{ '--rev-delay': '80ms' } as React.CSSProperties}>
              Nandan<br />
              Kumar<span className="accent">.</span>
            </h1>
            <div className="hero-role" data-reveal style={{ '--rev-delay': '160ms' } as React.CSSProperties}>
              Full-stack AI Engineer · 6+ years · {SITE.location}
            </div>
            <p className="hero-bio" data-reveal style={{ '--rev-delay': '240ms' } as React.CSSProperties}>
              I build production systems across <strong>EdTech, FinTech, SaaS</strong> and AI — most
              recently teaching agents to make phone calls, book tickets, and read résumés without
              losing their manners. Currently an AI engineer at Crownstack Technologies.
            </p>
            <div className="hero-ctas" data-reveal style={{ '--rev-delay': '320ms' } as React.CSSProperties}>
              <a href="#work" className="btn btn-primary">View selected work <span className="btn-arrow">↗</span></a>
              <a href={SITE.resume} download className="btn">Download résumé <span className="btn-arrow">↓</span></a>
              <a href={`mailto:${SITE.email}`} className="btn">Email <span className="btn-arrow">→</span></a>
            </div>
          </div>

          <aside className="hero-side" data-reveal style={{ '--rev-delay': '400ms' } as React.CSSProperties}>
            <div className="hero-card">
              <div className="hero-card-label">CURRENTLY SHIPPING</div>
              <div className="hero-card-title">Recruiter AI · v2</div>
              <div className="hero-card-meta">Voice agent, multilingual screening, structured evals</div>
            </div>
            <div className="hero-card">
              <div className="hero-card-label">LEADING</div>
              <div className="hero-card-title">Team of 6 engineers</div>
              <div className="hero-card-meta">Built &amp; mentored at DistrictD</div>
            </div>
            <div className="hero-card">
              <div className="hero-card-label">FOR HIRE</div>
              <div className="hero-card-title">Senior / Staff IC roles</div>
              <div className="hero-card-meta">Full-stack · agentic AI · platform · devex</div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
