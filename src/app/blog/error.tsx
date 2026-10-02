'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function BlogError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[blog] render error:', error);
  }, [error]);

  return (
    <section className="article">
      <div className="article-shell">
        <div className="article-toc" />
        <article className="article-main route-error">
          <div className="section-eyebrow">Something broke</div>
          <h1>The blog hit a snag</h1>
          <p>This page couldn’t load right now. It’s been logged — please try again in a moment.</p>
          <div className="route-error-actions">
            <button className="btn btn-primary" onClick={reset}>Try again</button>
            <Link className="btn" href="/">Reload</Link>
          </div>
        </article>
      </div>
    </section>
  );
}
