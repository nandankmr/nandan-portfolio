'use client';
import { useEffect, useRef, useState } from 'react';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import Now from '@/components/Now';
import Experience from '@/components/Experience';
import Work from '@/components/Work';
import Skills from '@/components/Skills';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import { ACCENT_OPTIONS, THEME_IDS, type Theme, type Accent } from '@/lib/data';

function hexToRgba(hex: string, a: number) {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function Page() {
  const [theme, setTheme] = useState<Theme>('minimal');
  const [accent, setAccent] = useState<Accent>('#a855f7');
  const progressRef = useRef<HTMLDivElement>(null);

  // Randomise on first mount (client-only to avoid hydration mismatch)
  useEffect(() => {
    setTheme(randomPick(THEME_IDS));
    setAccent(randomPick(ACCENT_OPTIONS));
  }, []);

  // Apply theme + accent to DOM
  useEffect(() => {
    document.body.dataset.theme = theme;
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-soft', hexToRgba(accent, 0.14));
  }, [theme, accent]);

  // Scroll progress bar
  useEffect(() => {
    const bar = progressRef.current;
    if (!bar) return;
    const update = () => {
      const h = document.documentElement;
      const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      bar.style.width = (p * 100).toFixed(2) + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
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
      <Nav theme={theme} onTheme={setTheme} accent={accent} onAccent={setAccent} />
      <Hero />
      <Marquee />
      <Now />
      <Experience />
      <Work />
      <Skills />
      <Contact />
      <Footer />
    </>
  );
}
