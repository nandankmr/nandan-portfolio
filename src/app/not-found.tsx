import type { Metadata } from 'next';
import Link from 'next/link';
import BlogChrome from '@/components/blog/BlogChrome';
import NotFoundTrace from '@/components/portfolio/NotFoundTrace';
import { blogUrl } from '@/lib/blog/urls';

export const metadata: Metadata = { title: 'Not found — Nandan Kumar', robots: { index: false } };

export default function NotFound() {
  return (
    <BlogChrome trail={<span className="pf-trail">404</span>}>
      <main className="pf pf-case pf-404">
        <div className="container">
          <div className="section-eyebrow">404 · route not found</div>
          <h1 className="pf-case-title">The agent looked everywhere.</h1>
          <p className="pf-case-lead">This page doesn&apos;t exist, or it moved. Here&apos;s what it tried, and where you probably meant to go.</p>
          <NotFoundTrace />
          <nav className="pf-404-links" aria-label="Suggestions">
            <Link href="/" className="btn btn-primary" data-magnetic>Home <span className="btn-arrow">→</span></Link>
            <Link href="/#work" className="btn" data-magnetic>Selected work</Link>
            <a href={blogUrl()} className="btn" data-magnetic>Blog</a>
            <Link href="/uses" className="btn" data-magnetic>/uses</Link>
          </nav>
        </div>
      </main>
    </BlogChrome>
  );
}
