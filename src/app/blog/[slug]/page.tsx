import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ArticleToc from '@/components/blog/ArticleToc';
import BlogChrome from '@/components/blog/BlogChrome';
import HermesBadge from '@/components/blog/HermesBadge';
import SafeMdx from '@/components/blog/SafeMdx';
import ShareButton from '@/components/blog/ShareButton';
import CommentsSection from '@/components/comments/CommentsSection';
import { getAdjacentPosts, getPostBySlug } from '@/lib/blog/posts';
import { blogUrl, postUrl, postVT } from '@/lib/blog/urls';
import { getPublicComments } from '@/lib/comments/db';
import { commentsGloballyEnabled } from '@/lib/comments/settings';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(date));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const { meta } = post;
  return {
    title: `${meta.title} — Nandan Kumar`,
    description: meta.description,
    alternates: { canonical: postUrl(meta.slug) },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: postUrl(meta.slug),
      siteName: 'Nandan Kumar',
      type: 'article',
      publishedTime: meta.publishedAt,
      modifiedTime: meta.updatedAt,
      authors: ['Nandan Kumar'],
      tags: meta.tags,
    },
    twitter: { card: 'summary_large_image', title: meta.title, description: meta.description },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [post, adjacent] = await Promise.all([
    getPostBySlug(slug),
    getAdjacentPosts(slug),
  ]);
  if (!post) notFound();

  const { meta, content } = post;
  const initialComments = await getPublicComments(slug, 20, 0);
  const postNumber = 1; // Ordering not critical without full list; use 1 as fallback
  const { previous, next } = adjacent;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: meta.title,
    description: meta.description,
    datePublished: meta.publishedAt,
    dateModified: meta.updatedAt ?? meta.publishedAt,
    author: { '@type': 'Person', name: 'Nandan Kumar', url: blogUrl() },
    mainEntityOfPage: postUrl(meta.slug),
    url: postUrl(meta.slug),
    keywords: meta.tags.join(', '),
  };

  return (
    <BlogChrome
      trail={
        <>
          <a href={blogUrl()}>Blog</a>
          <span className="sep">·</span>
          <span className="curr">Essay {String(Math.max(1, postNumber)).padStart(2, '0')}</span>
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <section className="article">
        <div className="article-shell">
          {meta.toc?.length ? <ArticleToc toc={meta.toc} /> : <aside className="article-toc" />}
          <article className="article-main">
            <div className="article-eyebrow" data-reveal>
              <span>Essay {String(Math.max(1, postNumber)).padStart(2, '0')}</span>
              <span>·</span>
              <span className="cat">{meta.category}</span>
              <span>·</span>
              <span>{meta.readTime}</span>
            </div>

            <h1 style={postVT(meta.slug)}>{meta.title}</h1>
            <p className="article-dek" data-reveal style={{ '--rev-delay': '120ms' } as React.CSSProperties}>{meta.dek}</p>

            <div className="article-byline" data-reveal style={{ '--rev-delay': '180ms' } as React.CSSProperties}>
              <span className="author">Nandan Kumar</span>
              <span>{formatDate(meta.publishedAt)}</span>
              {meta.authoredBy === 'hermes' && <HermesBadge />}
              <ShareButton url={postUrl(meta.slug)} title={meta.title} />
            </div>

            <div className="prose">
              <SafeMdx source={content} />
            </div>

            <a href={blogUrl()} className="back-to-index">← Back to blog</a>
            <CommentsSection
              postSlug={meta.slug}
              initialComments={initialComments.comments}
              total={initialComments.total}
              commentsEnabled={commentsGloballyEnabled() && (meta.commentsEnabled ?? true)}
            />
          </article>
        </div>

        <div className="article-foot">
          <div className="article-pager">
            {previous ? (
              <a className="pager-link prev" href={postUrl(previous.slug)}>
                <span className="pager-label">← Previous</span>
                <span className="pager-title">{previous.title}</span>
              </a>
            ) : <div />}
            {next ? (
              <a className="pager-link next" href={postUrl(next.slug)}>
                <span className="pager-label">Next →</span>
                <span className="pager-title">{next.title}</span>
              </a>
            ) : <div />}
          </div>
        </div>
      </section>
    </BlogChrome>
  );
}
