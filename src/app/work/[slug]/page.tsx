import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ViewTransition } from 'react';
import BlogChrome from '@/components/blog/BlogChrome';
import Diagram from '@/components/portfolio/Diagram';
import Interactions from '@/components/portfolio/Interactions';
import { WORK } from '@/components/portfolio/projects';
import { postUrl, siteUrl } from '@/lib/blog/urls';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return WORK.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = WORK.find((w) => w.id === slug);
  if (!p) return {};
  return {
    title: `${p.name} — Nandan Kumar`,
    description: p.summary,
    alternates: { canonical: siteUrl(`/work/${p.id}`) },
    openGraph: { title: `${p.name} — case study`, description: p.summary, url: siteUrl(`/work/${p.id}`), siteName: 'Nandan Kumar', type: 'article' },
  };
}

// Directional slide on navigations that carry a type; nothing on first load.
const DIR = { 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' };

export default async function CaseStudy({ params }: Props) {
  const { slug } = await params;
  const i = WORK.findIndex((w) => w.id === slug);
  if (i < 0) notFound();
  const p = WORK[i];
  const prev = WORK[(i - 1 + WORK.length) % WORK.length];
  const next = WORK[(i + 1) % WORK.length];

  return (
    <BlogChrome trail={<Link href="/#work" transitionTypes={['nav-back']} className="pf-trail">← All work</Link>}>
      <ViewTransition enter={DIR} exit={DIR} default="none">
        <article className="pf pf-case">
          <div className="container">
            <div className="section-eyebrow" data-reveal>Case study · {p.year} · {p.tag}</div>
            <ViewTransition name={`work-${p.id}`} share="pf-morph">
              <h1 className="pf-case-title">{p.name}</h1>
            </ViewTransition>
            <p className="pf-case-lead">{p.summary}</p>

            <dl className="pf-case-meta">
              <div><dt>Year</dt><dd>{p.year}</dd></div>
              <div><dt>Area</dt><dd>{p.tag}</dd></div>
              <div className="wide"><dt>Stack</dt><dd className="pf-chips">{p.stack.map((s) => <span key={s} className="chip">{s}</span>)}</dd></div>
            </dl>

            <Diagram id={p.id} />

            {p.setting && (
              <section className="pf-case-block pf-setting">
                <h2>The setting</h2>
                <p><strong>{p.setting.company}.</strong> {p.setting.about}</p>
                <p className="pf-setting-src">Company facts from {p.setting.source.map((s, k) => <span key={s.href}>{k > 0 && ' · '}<a href={s.href} target="_blank" rel="noreferrer">{s.label}</a></span>)}</p>
              </section>
            )}

            {p.bullets && (
              <section className="pf-case-block">
                <h2>What I built</h2>
                <ul className="pf-row-bullets">{p.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
              </section>
            )}

            {(p.links.length > 0 || p.reading) && (
              <section className="pf-case-block">
                <h2>Go deeper</h2>
                <div className="pf-case-links">
                  {p.links.map((l) => <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="btn" data-magnetic>{l.label} <span className="btn-arrow">↗</span></a>)}
                  {p.reading?.map((r) => <a key={r.slug} href={postUrl(r.slug)} className="pf-case-read">Read · {r.title} <span aria-hidden="true">↗</span></a>)}
                </div>
              </section>
            )}

            <nav className="pf-case-nav" aria-label="More work">
              <Link href={`/work/${prev.id}`} transitionTypes={['nav-back']}><small>← Previous</small>{prev.name}</Link>
              <Link href={`/work/${next.id}`} transitionTypes={['nav-forward']} className="next"><small>Next →</small>{next.name}</Link>
            </nav>
          </div>
        </article>
      </ViewTransition>
      <Interactions />
    </BlogChrome>
  );
}
