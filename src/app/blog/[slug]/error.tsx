'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function PostError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[blog/post] render error:', error);
  }, [error]);

  return (
    <section className="article">
      <div className="article-shell">
        <div className="article-toc" />
        <article className="article-main route-error">
          <div className="section-eyebrow">Something broke</div>
          <h1>This post couldn’t be rendered</h1>
          <p>
            There was a problem displaying this article. It’s been logged. You can try again,
            or head back to the blog.
          </p>
          <div className="route-error-actions">
            <button className="btn btn-primary" onClick={reset}>Try again</button>
            <Link className="btn" href="/">← Back to blog</Link>
          </div>
        </article>
      </div>
    </section>
  );
}
