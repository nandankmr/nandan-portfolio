import { notFound } from 'next/navigation';
import BlogChrome from '@/components/blog/BlogChrome';
import ArticleToc from '@/components/blog/ArticleToc';
import HermesBadge from '@/components/blog/HermesBadge';
import SafeMdx from '@/components/blog/SafeMdx';
import { getPostByPreviewToken } from '@/lib/blog/posts';
import { blogUrl } from '@/lib/blog/urls';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string }> };

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(date));
}

export default async function PreviewPage({ params, searchParams }: Props) {
  const [{ id }, { token }] = await Promise.all([params, searchParams]);
  if (!token) notFound();

  const post = await getPostByPreviewToken(id, token);
  if (!post) notFound();

  const { meta, content } = post;

  return (
    <BlogChrome
      trail={
        <>
          <a href={blogUrl()}>Blog</a>
          <span className="sep">·</span>
          <span className="curr">Draft preview</span>
        </>
      }
    >
      {/* Draft banner */}
      <div className="draft-banner">
        <span>⚠ Draft — not published</span>
        <span className="draft-banner-note">Only visible with this preview link</span>
      </div>

      <section className="article">
        <div className="article-shell">
          {meta.toc?.length ? <ArticleToc toc={meta.toc} /> : <aside className="article-toc" />}
          <article className="article-main">
            <div className="article-eyebrow" data-reveal>
              <span className="cat">{meta.category}</span>
              <span>·</span>
              <span>{meta.readTime}</span>
              <span>·</span>
              <span style={{ color: 'var(--accent)' }}>Draft</span>
            </div>

            <h1 data-reveal style={{ '--rev-delay': '60ms' } as React.CSSProperties}>{meta.title}</h1>
            <p className="article-dek" data-reveal style={{ '--rev-delay': '120ms' } as React.CSSProperties}>{meta.dek}</p>

            <div className="article-byline" data-reveal style={{ '--rev-delay': '180ms' } as React.CSSProperties}>
              <span className="author">Nandan Kumar</span>
              <span>{formatDate(meta.publishedAt)}</span>
              {meta.authoredBy === 'hermes' && <HermesBadge />}
            </div>

            <div className="prose">
              <SafeMdx source={content} />
            </div>
          </article>
        </div>
      </section>
    </BlogChrome>
  );
}
