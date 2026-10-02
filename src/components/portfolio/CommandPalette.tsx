'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SITE, type Theme } from '@/lib/data';
import { blogUrl } from '@/lib/blog/urls';

type Cmd = { id: string; label: string; hint: string; keys: string; run: () => void | string };

const SPIN = ['✻', '✽', '✶', '✳'];

export default function CommandPalette({ onClose, onTheme }: { onClose: () => void; onTheme: (t: Theme) => void }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const [busy, setBusy] = useState<string | null>(null); // label while "thinking"
  const [tick, setTick] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const back = useRef<HTMLElement | null>(null);

  const cmds = useMemo<Cmd[]>(() => {
    const go = (id: string) => () => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };
    const ext = (u: string) => () => { window.open(u, '_blank', 'noopener'); };
    return [
      { id: 'work', label: 'Take me to the work', hint: 'section', keys: 'projects case study', run: go('work') },
      { id: 'career', label: 'Show the career log', hint: 'section', keys: 'experience git history jobs', run: go('career') },
      { id: 'how', label: 'How do you work?', hint: 'section', keys: 'claude code codex workflow ai', run: go('how') },
      { id: 'stack', label: 'Show the stack', hint: 'section', keys: 'skills tools tech', run: go('stack') },
      { id: 'uses', label: 'Open /uses — every tool, in detail', hint: 'page', keys: 'uses tools stack setup', run: () => { window.location.href = '/uses'; } },
      { id: 'writing', label: 'What have you written?', hint: 'section', keys: 'blog posts writing', run: go('writing') },
      { id: 'contact', label: 'Get in touch', hint: 'section', keys: 'contact email message', run: go('contact') },
      { id: 'hire', label: 'Hire Nandan', hint: 'action', keys: 'hire job offer recruit role', run: () => {
        go('contact')();
        window.dispatchEvent(new CustomEvent('pf:prefill', { detail: "Hi Nandan — we're hiring for a senior / staff role and your voice-agent work caught our eye.\n\nTeam: …\nStack: …\nSalary band: …" }));
        setTimeout(() => document.querySelector<HTMLInputElement>('#contact input[name="name"]')?.focus({ preventScroll: true }), 700);
        return 'Drafted a message for you ✍';
      } },
      { id: 'email', label: `Copy email — ${SITE.email}`, hint: 'action', keys: 'mail copy', run: () => { navigator.clipboard?.writeText(SITE.email); return 'Copied to clipboard'; } },
      { id: 'resume', label: 'Download the résumé', hint: 'action', keys: 'cv pdf resume', run: () => { const a = document.createElement('a'); a.href = SITE.resume; a.download = ''; a.click(); } },
      { id: 'blog', label: 'Open the blog', hint: 'link', keys: 'writing posts', run: () => { window.location.href = blogUrl(); } },
      { id: 'github', label: 'Open GitHub', hint: 'link', keys: 'code repos', run: ext(`https://${SITE.github}`) },
      { id: 'linkedin', label: 'Open LinkedIn', hint: 'link', keys: 'profile', run: ext(`https://${SITE.linkedin}`) },
      { id: 't-minimal', label: 'Theme: Minimal', hint: 'theme', keys: 'light', run: () => onTheme('minimal') },
      { id: 't-terminal', label: 'Theme: Terminal', hint: 'theme', keys: 'dark mono', run: () => onTheme('terminal') },
      { id: 't-bold', label: 'Theme: Bold', hint: 'theme', keys: 'loud', run: () => onTheme('bold') },
    ];
  }, [onTheme]);

  const list = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter((w) => w && !['take', 'me', 'to', 'the', 'show', 'open', 'a', 'please'].includes(w));
    if (!words.length) return cmds;
    return cmds.filter((c) => words.every((w) => (c.label + ' ' + c.keys + ' ' + c.hint).toLowerCase().includes(w)));
  }, [q, cmds]);

  // Mounted only while open (see PortfolioPage), so state starts fresh.
  useEffect(() => {
    back.current = document.activeElement as HTMLElement;
    requestAnimationFrame(() => input.current?.focus());
    return () => back.current?.focus?.();
  }, []);

  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setTick((t) => t + 1), 110);
    return () => clearInterval(id);
  }, [busy]);

  const exec = (c: Cmd | undefined) => {
    if (!c || busy) return;
    setBusy('Thinking…');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => {
      const msg = c.run();
      if (typeof msg === 'string') { setBusy(msg); setTimeout(onClose, 650); } else onClose();
    }, reduce ? 0 : 420);
  };

  return (
    <div className="pf-pal-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pf-pal" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="pf-pal-input">
          <span className="accent" aria-hidden="true">›</span>
          <input
            ref={input}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSel(0); }}
            placeholder="Ask, e.g. “take me to the stack”"
            role="combobox"
            aria-expanded="true"
            aria-controls="pf-pal-list"
            aria-activedescendant={list[sel] ? `pf-cmd-${list[sel].id}` : undefined}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(list.length - 1, s + 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
              else if (e.key === 'Enter') { e.preventDefault(); exec(list[sel]); }
              else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
            }}
          />
          <kbd>esc</kbd>
        </div>
        {busy ? (
          <div className="pf-pal-busy" role="status"><span className="accent">{busy === 'Thinking…' ? SPIN[tick % SPIN.length] : '✓'}</span> {busy}</div>
        ) : (
          <ul id="pf-pal-list" role="listbox" className="pf-pal-list">
            {list.length === 0 && <li className="pf-pal-empty">No idea — try “stack”, “email” or “theme”.</li>}
            {list.map((c, i) => (
              <li
                key={c.id}
                id={`pf-cmd-${c.id}`}
                role="option"
                aria-selected={i === sel}
                className={i === sel ? 'sel' : ''}
                onMouseEnter={() => setSel(i)}
                onClick={() => exec(c)}
              >
                <span>{c.label}</span><span className="pf-pal-hint">{c.hint}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
