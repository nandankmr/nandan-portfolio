'use client';

import { useMemo, useState } from 'react';
import { blogUrl, postUrl, siteUrl } from '@/lib/blog/urls';
import type { BlogPostMeta } from '@/lib/blog/types';

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(date));
}

export default function BlogIndexClient({
  posts,
  featured,
  categories,
}: {
  posts: BlogPostMeta[];
  featured?: BlogPostMeta;
  categories: string[];
}) {
  const [filter, setFilter] = useState('All');
  const visible = useMemo(
    () => filter === 'All' ? posts : posts.filter((post) => post.category === filter),
    [filter, posts]
  );
  const rows = visible.filter((post) => !(filter === 'All' && featured?.slug === post.slug));

  return (
    <>
      <section className="blog-hero">
        <div className="container">
          <div className="blog-hero-eyebrow" data-reveal>· Blog — AI, systems, leadership</div>
          <h1 data-reveal style={{ '--rev-delay': '80ms' } as React.CSSProperties}>
            A small <em>journal</em> of engineering<br />
            in the company of agents.
          </h1>
          <p className="blog-hero-lede" data-reveal style={{ '--rev-delay': '160ms' } as React.CSSProperties}>
            Essays on AI engineering, leadership, and the unglamorous infrastructure I build for a living. Long-form, slowly written, posted when ready.
          </p>
        </div>
      </section>

      <section className="blog-index-section">
        <div className="container blog-container">
          {featured && filter === 'All' && (
            <a href={postUrl(featured.slug)} className="blog-featured" data-reveal>
              <span className="featured-num">01</span>
              <div>
                <div className="featured-meta">★ Featured · {featured.category}</div>
                <h2>{featured.title}</h2>
                <p>{featured.dek}</p>
              </div>
              <div className="featured-tail">
                <span>{formatDate(featured.publishedAt)}</span>
                <span>{featured.readTime}</span>
                <span className="arrow">↗</span>
              </div>
            </a>
          )}

          <div className="blog-list-head">
            <div className="label" data-reveal>All essays · {posts.length}</div>
            <div className="filters" data-reveal>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={'blog-filter-chip' + (filter === category ? ' active' : '')}
                  onClick={() => setFilter(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <ul className="blog-list">
            {rows.map((post, index) => (
              <li key={post.slug}>
                <a
                  className="blog-row"
                  href={post.draft ? blogUrl() : postUrl(post.slug)}
                  aria-disabled={post.draft ? true : undefined}
                  data-reveal
                  style={{ '--rev-delay': `${index * 50}ms` } as React.CSSProperties}
                >
                  <div>
                    <div className="blog-row-cat">{post.draft ? 'Draft · ' : ''}{post.category}</div>
                    <h3 className="blog-row-title">{post.title}</h3>
                    <p className="blog-row-excerpt">{post.dek}</p>
                  </div>
                  <div className="blog-row-meta">
                    <span>{formatDate(post.publishedAt)}</span>
                    <span>{post.readTime}</span>
                    <span className="blog-row-arrow">↗</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>

          <div className="blog-sub" data-reveal>
            <div>
              <h3>Get the next <em>essay</em> in your inbox.</h3>
              <p>About one a month. Long-form only. No filler, no growth-hack noise, just engineering notes worth keeping.</p>
            </div>
            <form action={siteUrl('/#contact')}>
              <input type="email" placeholder="you@company.com" aria-label="Email address" />
              <button type="submit">Subscribe →</button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
