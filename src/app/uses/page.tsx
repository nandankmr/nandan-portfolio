import type { Metadata } from 'next';
import Link from 'next/link';
import BlogChrome from '@/components/blog/BlogChrome';
import { brandOf, ToolIcon } from '@/components/portfolio/icons';
import { toolKey } from '@/components/portfolio/keys';
import { SKILLS } from '@/lib/data';
import { siteUrl } from '@/lib/blog/urls';

export const metadata: Metadata = {
  title: 'Uses — Nandan Kumar',
  description: 'The tools, languages and services I build with, how long I have used each, and where.',
  alternates: { canonical: siteUrl('/uses') },
};

// Generated from the same SKILLS data as the homepage stack, so it never drifts.
export default function UsesPage() {
  const max = Math.max(...SKILLS.flatMap((c) => c.items.map((i) => i.years)));
  const total = SKILLS.reduce((n, c) => n + c.items.length, 0);
  return (
    <BlogChrome trail={<Link href="/" className="pf-trail">← Home</Link>}>
      <article className="pf pf-case pf-uses">
        <div className="container">
          <div className="section-eyebrow" data-reveal>/uses · {total} tools</div>
          <h1 className="pf-case-title">What I build with</h1>
          <p className="pf-case-lead">Every tool on the homepage, with how long I&apos;ve used it and where it shipped. Bars are years of use.</p>

          {SKILLS.map((cat) => (
            <section key={cat.cat} className="pf-uses-cat">
              <header>
                <h2>{cat.cat}</h2>
                <p>{cat.take}</p>
              </header>
              <ul>
                {cat.items.map((it) => {
                  const k = toolKey(it.name);
                  const { brand } = brandOf(k);
                  return (
                    <li key={it.name} style={{ '--brand': brand, '--w': `${(it.years / max) * 100}%` } as React.CSSProperties}>
                      <span className="pf-uses-ico"><ToolIcon k={k} /></span>
                      <span className="pf-uses-name">{it.name}</span>
                      <span className="pf-uses-bar" aria-hidden="true"><i /></span>
                      <span className="pf-uses-yrs">{it.years} {it.years === 1 ? 'year' : 'years'}</span>
                      <span className="pf-uses-where">{it.projects.join(' · ')}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </article>
    </BlogChrome>
  );
}
