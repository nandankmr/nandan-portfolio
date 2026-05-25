'use client';
import { useEffect, useRef, useState } from 'react';
import { SITE, ACCENT_OPTIONS, THEME_IDS, type Theme, type Accent } from '@/lib/data';

const NAV_SECTIONS = [
  ['home', 'Index'],
  ['now', 'Now'],
  ['experience', 'Experience'],
  ['work', 'Work'],
  ['skills', 'Stack'],
  ['contact', 'Contact'],
] as const;

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

function ThemeSwitcher({ value, onChange }: { value: Theme; onChange: (v: Theme) => void }) {
  return (
    <div className="theme-switch" role="tablist" aria-label="Theme">
      {THEMES.map((th) => (
        <button
          key={th.id}
          role="tab"
          aria-selected={value === th.id}
          aria-label={th.label}
          title={th.label}
          onClick={() => onChange(th.id)}
          className={'theme-swatch' + (value === th.id ? ' active' : '')}
        >
          {th.icon}
        </button>
      ))}
    </div>
  );
}

function AccentSwitcher({ value, onChange }: { value: Accent; onChange: (v: Accent) => void }) {
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
            aria-selected={isActive}
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

export default function Nav({ theme, onTheme, accent, onAccent }: {
  theme: Theme;
  onTheme: (v: Theme) => void;
  accent: Accent;
  onAccent: (v: Accent) => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('home');

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      let current = 'home';
      for (const [id] of NAV_SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) current = id;
      }
      setActive(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={'nav' + (scrolled ? ' scrolled' : '')}>
      <a href="#home" className="nav-logo">
        <span className="dot" aria-hidden="true" />
        nandan.dev
      </a>
      <div className="nav-links">
        {NAV_SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`} className={active === id ? 'active' : ''}>{label}</a>
        ))}
      </div>
      <div className="nav-right">
        <ThemeSwitcher value={theme} onChange={onTheme} />
        <AccentSwitcher value={accent} onChange={onAccent} />
        <a href={SITE.resume} download className="nav-cta">Résumé ↓</a>
      </div>
    </nav>
  );
}
