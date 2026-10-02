'use client';

import { useEffect, useState } from 'react';
import type { BlogPostMeta } from '@/lib/blog/types';

export default function ArticleToc({ toc }: { toc: NonNullable<BlogPostMeta['toc']> }) {
  const [activeId, setActiveId] = useState(toc[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (!visible.length) return;
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        setActiveId(visible[0].target.id);
      },
      { rootMargin: '-100px 0px -70% 0px', threshold: 0 }
    );

    toc.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  return (
    <aside className="article-toc">
      <div className="article-toc-title">Contents</div>
      <div className="article-toc-list">
        {toc.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={activeId === item.id ? 'active' : ''}
          >
            {item.label}
          </a>
        ))}
      </div>
    </aside>
  );
}
