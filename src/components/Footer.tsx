'use client';
import { useIstClock } from '@/components/portfolio/Hero';
import { siteUrl } from '@/lib/blog/urls';

// One footer for the portfolio, case studies and blog.
export default function Footer() {
  const t = useIstClock();
  return (
    <footer className="pf-footer">
      <span>© {new Date().getFullYear()} Nandan Kumar</span>
      <span>Noida · {t || '··:··'} IST · <a href={siteUrl('/uses')}>/uses</a> · <a href={siteUrl('/resume')}>/resume</a></span>
      <span>Built with Claude Code + Codex · reviewed by a human</span>
    </footer>
  );
}
