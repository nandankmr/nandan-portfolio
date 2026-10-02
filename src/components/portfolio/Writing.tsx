import { blogUrl, postUrl } from '@/lib/blog/urls';

export type PostCard = { slug: string; title: string; dek: string; date: string; readTime: string; category: string };

const fmt = (d: string) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export default function Writing({ posts }: { posts: PostCard[] }) {
  if (posts.length === 0) return null;
  return (
    <section id="writing" className="pf-section">
      <div className="container">
        <div className="section-eyebrow" data-reveal>· Writing — notes from the build</div>
        <div className="pf-head">
          <h2 className="pf-h2" data-reveal>I write down what broke, <span className="muted">and why.</span></h2>
          <a href={blogUrl()} className="link-pill" data-reveal>All posts ↗</a>
        </div>
        <ul className="pf-posts">
          {posts.map((p, i) => (
            <li key={p.slug} data-reveal style={{ '--rev-delay': `${i * 70}ms` } as React.CSSProperties}>
              <a href={postUrl(p.slug)} className="pf-post" data-cursor="Read">
                <span className="pf-post-meta"><span>{fmt(p.date)}</span><span>{p.category} · {p.readTime}</span></span>
                <span className="pf-post-title">{p.title}</span>
                <span className="pf-post-dek">{p.dek}</span>
                <span className="pf-post-arrow" aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
