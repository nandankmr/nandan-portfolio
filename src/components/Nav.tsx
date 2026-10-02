'use client';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { SITE, ACCENT_OPTIONS, type Theme, type Accent } from '@/lib/data';
import { blogUrl } from '@/lib/blog/urls';

const NAV_SECTIONS = [
  ['home', 'Index'],
  ['work', 'Work'],
  ['career', 'Career'],
  ['how', 'How I work'],
  ['stack', 'Stack'],
  ['blog', 'Blog', blogUrl()],
  ['contact', 'Contact'],
] as const;

// Theme swaps reveal as a circle spreading from the clicked button, where the
// View Transitions API exists; elsewhere they simply switch.
function switchTheme(e: React.MouseEvent, id: Theme, onChange: (v: Theme) => void) {
  const apply = () => { document.body.dataset.theme = id; onChange(id); };
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return apply();
  const r = Math.hypot(Math.max(e.clientX, innerWidth - e.clientX), Math.max(e.clientY, innerHeight - e.clientY));
  document.documentElement.style.setProperty('--vt-x', `${e.clientX}px`);
  document.documentElement.style.setProperty('--vt-y', `${e.clientY}px`);
  document.documentElement.style.setProperty('--vt-r', `${r}px`);
  // The class scopes the circle CSS to theme switches, not route transitions.
  document.documentElement.classList.add('vt-theme');
  const vt = doc.startViewTransition(() => flushSync(apply)) as { finished?: Promise<void> } | undefined;
  vt?.finished?.finally(() => document.documentElement.classList.remove('vt-theme'));
}

const THEMES = [
  {
    id: 'minimal' as Theme,
    label: 'Minimal',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <circle cx="7" cy="7" r="2.6" />
        <path d="M7 1.4 V3 M7 11 V12.6 M1.4 7 H3 M11 7 H12.6 M2.9 2.9 L4 4 M10 10 L11.1 11.1 M11.1 2.9 L10 4 M4 10 L2.9 11.1" />
      </svg>
    ),
  },
  {
    id: 'terminal' as Theme,
    label: 'Terminal',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4 L6 7 L3 10" />
        <path d="M7.5 10.4 H11.2" />
      </svg>
    ),
  },
  {
    id: 'bold' as Theme,
    label: 'Bold',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <text x="7" y="11" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="12" letterSpacing="-0.05em">B</text>
      </svg>
    ),
  },
];

export function ThemeSwitcher({ value, onChange }: { value: Theme; onChange: (v: Theme) => void }) {
  return (
    <div className="theme-switch" role="tablist" aria-label="Theme">
      {THEMES.map((th) => (
        <button
          key={th.id}
          role="tab"
          aria-selected={value === th.id}
          aria-label={th.label}
          title={th.label}
          onClick={(e) => switchTheme(e, th.id, onChange)}
          className={'theme-swatch' + (value === th.id ? ' active' : '')}
        >
          {th.icon}
        </button>
      ))}
    </div>
  );
}

export function AccentSwitcher({ value, onChange }: { value: Accent; onChange: (v: Accent) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={'accent-switch' + (open ? ' open' : '')} role="tablist" aria-label="Accent color">
      {ACCENT_OPTIONS.map((color) => {
        const isActive = value === color;
        return (
          <button
            key={color}
            type="button"
            aria-pressed={isActive}
            aria-label={`Accent ${color}`}
            title={open ? color : 'Change accent'}
            onClick={() => {
              if (!open) { setOpen(true); return; }
              onChange(color as Accent);
              setOpen(false);
            }}
            className={'accent-dot' + (isActive ? ' active' : '')}
            style={{ '--c': color } as React.CSSProperties}
            tabIndex={(open || isActive) ? 0 : -1}
          />
        );
      })}
    </div>
  );
}

export default function Nav({ theme, onTheme, accent, onAccent, onPalette }: {
  theme: Theme;
  onTheme: (v: Theme) => void;
  accent: Accent;
  onAccent: (v: Accent) => void;
  onPalette?: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('home');
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      // Page order; the on-page "writing" section lights the Blog link.
      let current = 'home';
      for (const id of ['home', 'work', 'career', 'how', 'stack', 'writing', 'contact']) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) current = id === 'writing' ? 'blog' : id;
      }
      setActive(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // One indicator dot that glides to the active link.
  useEffect(() => {
    const box = linksRef.current;
    const a = box?.querySelector<HTMLElement>('a.active');
    if (box && a) box.style.setProperty('--ind-x', `${a.offsetLeft + a.offsetWidth / 2 - 2}px`);
  }, [active]);

  return (
    <nav className={'nav' + (scrolled ? ' scrolled' : '')}>
      <a href="#home" className="nav-logo">
        <span className="dot" aria-hidden="true" />
        nandankumar.com
      </a>
      <div className="nav-links has-ind" ref={linksRef}>
        {NAV_SECTIONS.map(([id, label, href]) => (
          <a key={id} href={href ?? `#${id}`} className={active === id ? 'active' : ''}>{label}</a>
        ))}
        <span className="nav-ind" aria-hidden="true" />
      </div>
      <div className="nav-right">
        {onPalette && <button type="button" className="nav-k" onClick={onPalette} aria-label="Open command palette"><kbd>⌘</kbd><kbd>K</kbd></button>}
        <ThemeSwitcher value={theme} onChange={onTheme} />
        <AccentSwitcher value={accent} onChange={onAccent} />
        <a href={SITE.resume} download className="nav-cta">Résumé ↓</a>
      </div>
    </nav>
  );
}
