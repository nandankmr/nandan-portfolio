'use client';

import { useEffect, useRef, useState } from 'react';
import Footer from '@/components/Footer';
import { AccentSwitcher, ThemeSwitcher } from '@/components/Nav';
import DiagramLightbox from '@/components/blog/DiagramLightbox';
import { type Accent, type Theme } from '@/lib/data';
import { siteUrl } from '@/lib/blog/urls';

function hexToRgba(hex: string, a: number) {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export default function BlogChrome({
  children,
  trail,
}: {
  children: React.ReactNode;
  trail: React.ReactNode;
}) {
  // Fixed defaults: light ('minimal') theme + #ff5b2e accent. The switchers
  // still let visitors change these for the session.
  const [theme, setTheme] = useState<Theme>('minimal');
  const [accent, setAccent] = useState<Accent>('#ff5b2e');
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.dataset.theme = theme;
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-soft', hexToRgba(accent, 0.14));
  }, [theme, accent]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const bar = progressRef.current;
      if (!bar) return;
      const h = document.documentElement;
      const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      bar.style.width = (p * 100).toFixed(2) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]:not(.in)');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });

  return (
    <>
      <div ref={progressRef} className="progress" />
      <nav className={'nav' + (scrolled ? ' scrolled' : '')}>
        <a href={siteUrl()} className="nav-logo">
          <span className="dot" aria-hidden="true" />
          nandankumar.com
        </a>
        <div className="nav-blog-trail">{trail}</div>
        <div className="nav-right">
          <ThemeSwitcher value={theme} onChange={setTheme} />
          <AccentSwitcher value={accent} onChange={setAccent} />
          <a href={siteUrl('/#contact')} className="nav-cta">Get in touch</a>
        </div>
      </nav>
      {children}
      <Footer />
      <DiagramLightbox />
    </>
  );
}
