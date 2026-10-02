'use client';
import { useCallback, useEffect, useRef, useState, ViewTransition } from 'react';
import Nav from '@/components/Nav';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import { type Theme, type Accent, SITE } from '@/lib/data';
import { HighlightProvider } from './highlight';
import Hero from './Hero';
import WorkIndex from './WorkIndex';
import GitGraph from './GitGraph';
import HowIWork from './HowIWork';
import Writing, { type PostCard } from './Writing';
import CommandPalette from './CommandPalette';
import Interactions from './Interactions';
import Kinetic from './Kinetic';
import { decodeEl } from './Scramble';

// Directional slide on typed navigations (to / from case studies).
const DIR = { 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' };

function hexToRgba(hex: string, a: number) {
  const m = hex.replace('#', '');
  return `rgba(${parseInt(m.slice(0, 2), 16)}, ${parseInt(m.slice(2, 4), 16)}, ${parseInt(m.slice(4, 6), 16)}, ${a})`;
}

// `stack` is rendered on the server (see app/page.tsx) so its logos stay out of the JS bundle.
export default function PortfolioPage({ posts, stack }: { posts: PostCard[]; stack: React.ReactNode }) {
  // Fixed defaults: light ('minimal') theme + #ff5b2e accent. The Nav
  // switchers still let visitors change these for the session.
  const [theme, setTheme] = useState<Theme>('minimal');
  const [accent, setAccent] = useState<Accent>('#ff5b2e');
  const [palette, setPalette] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const openPalette = useCallback(() => setPalette(true), []);

  useEffect(() => {
    document.body.dataset.theme = theme;
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-soft', hexToRgba(accent, 0.14));
  }, [theme, accent]);

  useEffect(() => {
    const bar = progressRef.current;
    if (!bar) return;
    const update = () => {
      const h = document.documentElement;
      bar.style.width = ((h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) * 100).toFixed(2) + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]:not(.in)');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
        if (e.target.classList.contains('section-eyebrow')) decodeEl(e.target as HTMLElement);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });

  // Section headings drift slightly against the scroll (parallax).
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const heads = Array.from(document.querySelectorAll<HTMLElement>('.pf .pf-h2'));
    let raf = 0;
    const update = () => {
      const vh = window.innerHeight;
      for (const h of heads) {
        const r = h.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) continue;
        const k = (r.top + r.height / 2 - vh / 2) / vh; // -0.5 … 0.5 across the viewport
        h.style.translate = `0 ${(k * -28).toFixed(1)}px`;
      }
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  // Konami code → terminal mode (CRT + Terminal theme). Esc restores.
  const [crt, setCrt] = useState(false);
  const prevTheme = useRef<Theme>('minimal');
  useEffect(() => {
    const code = 'arrowup arrowup arrowdown arrowdown arrowleft arrowright arrowleft arrowright b a';
    let recent: string[] = []; // rolling window, so stray extra presses still count
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'escape' && document.documentElement.classList.contains('pf-crt')) {
        document.documentElement.classList.remove('pf-crt');
        setCrt(false);
        setTheme(prevTheme.current);
        return;
      }
      recent = [...recent, k].slice(-10);
      if (recent.join(' ') === code) {
        recent = [];
        setTheme((t) => { prevTheme.current = t; return 'terminal'; });
        document.documentElement.classList.add('pf-crt');
        setCrt(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p); }
    };
    window.addEventListener('keydown', onKey);
    console.log(
      '%cHey, fellow engineer 👋%c\nYou opened DevTools on a portfolio, so we should probably talk.\n→ ' + SITE.email,
      'font: 600 15px Inter, sans-serif', 'font: 13px Inter, sans-serif',
    );
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <HighlightProvider>
      <div ref={progressRef} className="progress" />
      <Nav theme={theme} onTheme={setTheme} accent={accent} onAccent={setAccent} onPalette={openPalette} />
      <ViewTransition enter={DIR} exit={DIR} default="none">
      <main className="pf">
        <Hero onPalette={openPalette} />
        <WorkIndex />
        <GitGraph />
        <HowIWork />
        {stack}
        <Writing posts={posts} />
        <Kinetic />
        <Contact />
      </main>
      </ViewTransition>
      <Footer />
      {palette && <CommandPalette onClose={() => setPalette(false)} onTheme={setTheme} />}
      <Interactions />
      {crt && <div className="pf-toast" role="status"><span className="accent">$</span> sudo mode unlocked — terminal theme on. <kbd>esc</kbd> to exit</div>}
    </HighlightProvider>
  );
}
