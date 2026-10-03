import type { Metadata } from 'next';
import Link from 'next/link';
import BlogChrome from '@/components/blog/BlogChrome';
import PrintButton from '@/components/portfolio/PrintButton';
import { WORK } from '@/components/portfolio/projects';
import { EXPERIENCE, SITE, SKILLS } from '@/lib/data';
import { siteUrl } from '@/lib/blog/urls';

export const metadata: Metadata = {
  title: 'Résumé — Nandan Kumar',
  description: 'Senior Full-stack & AI Engineer. Always-current résumé, generated from the same data as nandankumar.com.',
  alternates: { canonical: siteUrl('/resume') },
};

// Generated from lib/data.ts, so it can't drift from the site.
// Print / "Save as PDF" produces a clean A4 document (see @media print).
export default function ResumePage() {
  const featured = WORK.filter((w) => ['recruiter-ai', 'ticket-booking', 'checkministry', 'avendus'].includes(w.id));
  return (
    <BlogChrome trail={<Link href="/" className="pf-trail">← Home</Link>}>
      <main className="pf pf-cv-wrap">
        <div className="pf-cv-bar">
          <span>Always current: built from the same data as this site.</span>
          <PrintButton />
          <a href={SITE.resume} download className="link-pill">Original PDF ↓</a>
        </div>

        <article className="pf-cv">
          <header className="pf-cv-head">
            <div>
              <h1>Nandan Kumar</h1>
              <p className="pf-cv-role">{SITE.role}</p>
            </div>
            <ul className="pf-cv-contact">
              <li><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
              <li><a href={`tel:${SITE.phone.replace(/\s/g, '')}`}>{SITE.phone}</a></li>
              <li><a href={`https://${SITE.linkedin}`}>{SITE.linkedin}</a></li>
              <li><a href={`https://${SITE.github}`}>{SITE.github}</a></li>
              <li><a href={siteUrl()}>nandankumar.com</a> · Noida, India ({SITE.timezone})</li>
            </ul>
          </header>

          <section>
            <h2>Summary</h2>
            <p>
              Full-stack engineer with 6+ years shipping production systems across EdTech, FinTech and SaaS, now building
              agentic AI: voice agents that run live phone screens and multi-agent booking flows. Led a team of 6; comfortable
              owning a product end-to-end, from the React surface to the AWS infrastructure under it.
            </p>
          </section>

          <section>
            <h2>Experience</h2>
            {EXPERIENCE.map((job) => (
              <div key={job.company} className="pf-cv-job">
                <div className="pf-cv-job-head">
                  <h3>{job.role} <span>· {job.company}</span></h3>
                  <span className="pf-cv-when">{job.period}</span>
                </div>
                <p className="pf-cv-meta">{job.location} · {job.kind}</p>
                <ul>{job.points.map((p) => <li key={p}>{p}</li>)}</ul>
                <p className="pf-cv-stack">{job.stack.join(' · ')}</p>
              </div>
            ))}
          </section>

          <section>
            <h2>Selected projects</h2>
            {featured.map((p) => (
              <div key={p.id} className="pf-cv-proj">
                <h3>{p.name} <span>· {p.year}</span></h3>
                <p>{p.summary}</p>
              </div>
            ))}
          </section>

          <section className="pf-cv-two">
            <div>
              <h2>Skills</h2>
              <dl className="pf-cv-skills">
                {SKILLS.map((c) => (
                  <div key={c.cat}><dt>{c.cat}</dt><dd>{c.items.map((i) => i.name).join(', ')}</dd></div>
                ))}
              </dl>
            </div>
            <div>
              <h2>Education</h2>
              <p><strong>MCA</strong>, Jain University</p>
              <h2 className="pf-cv-mt">Open to</h2>
              <p>Senior / Staff IC roles · remote-first preferred</p>
            </div>
          </section>
        </article>
      </main>
    </BlogChrome>
  );
}
