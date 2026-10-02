'use client';

import { useEffect, useRef, useState } from 'react';

export default function ShareButton({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close the fallback menu on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleShare = async () => {
    // Prefer the native share sheet when available (mobile + many desktops).
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User dismissed or share failed — fall through to the popover.
      }
    }
    setOpen((v) => !v);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const liHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="share-wrap" ref={wrapRef}>
      <button
        type="button"
        className="share"
        onClick={handleShare}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Share ↗
      </button>
      {open && (
        <div className="share-menu" role="menu">
          <button type="button" role="menuitem" className="share-menu-item" onClick={copyLink}>
            {copied ? 'Link copied' : 'Copy link'}
          </button>
          <a role="menuitem" className="share-menu-item" href={xHref} target="_blank" rel="noopener noreferrer">
            Share on X
          </a>
          <a role="menuitem" className="share-menu-item" href={liHref} target="_blank" rel="noopener noreferrer">
            Share on LinkedIn
          </a>
        </div>
      )}
    </div>
  );
}
