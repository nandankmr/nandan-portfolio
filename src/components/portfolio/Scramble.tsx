'use client';
import { useEffect, useRef, useState } from 'react';

const GLYPHS = 'abcdefghijklmnopqrstuvwxyz#%&*+=<>/\\[]{}';

// Text that "decodes": characters churn, then lock in left to right.
// `run` re-triggers the decode (e.g. when a section scrolls into view).
export function decode(from: string, to: string, onFrame: (s: string) => void, done?: () => void) {
  const len = Math.max(from.length, to.length);
  let frame = 0, raf = 0;
  const tick = () => {
    frame++;
    let out = '';
    for (let i = 0; i < len; i++) {
      const lock = 3 + i * 1.4;
      if (frame >= lock) out += to[i] ?? '';
      else if (to[i] === ' ' || from[i] === ' ') out += ' ';
      else out += frame > lock - 6 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : (from[i] ?? '');
    }
    onFrame(out);
    if (frame < 3 + len * 1.4) raf = requestAnimationFrame(tick); else done?.();
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

// Cycles through phrases, decoding from one to the next.
export function Cycler({ phrases, every = 2800 }: { phrases: string[]; every?: number }) {
  const [text, setText] = useState(phrases[0]);
  const idx = useRef(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let stop = () => {};
    const id = setInterval(() => {
      const from = phrases[idx.current];
      idx.current = (idx.current + 1) % phrases.length;
      stop = decode(from, phrases[idx.current], setText);
    }, every);
    return () => { clearInterval(id); stop(); };
  }, [phrases, every]);
  return (
    <span className="pf-cycle">
      <span className="sr-only">{phrases.join(', ')}</span>
      <span aria-hidden="true">{text}</span>
    </span>
  );
}

// Decode an element's existing text in place. Mutates text-node values (not
// the nodes themselves), so React's references stay valid.
export function decodeEl(el: HTMLElement) {
  if (el.dataset.decoded || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  el.dataset.decoded = '1';
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: { n: Text; text: string; offset: number }[] = [];
  let offset = 0;
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    nodes.push({ n, text: n.nodeValue ?? '', offset });
    offset += n.nodeValue?.length ?? 0;
  }
  let frame = 0;
  const tick = () => {
    frame++;
    for (const { n, text, offset: o } of nodes) {
      let out = '';
      for (let i = 0; i < text.length; i++) {
        const lock = 2 + (o + i) * 0.9;
        out += frame >= lock || text[i] === ' ' || text[i] === '·' ? text[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      n.nodeValue = out;
    }
    if (frame < 3 + offset * 0.9) requestAnimationFrame(tick);
    else nodes.forEach(({ n, text }) => { n.nodeValue = text; });
  };
  requestAnimationFrame(tick);
}
