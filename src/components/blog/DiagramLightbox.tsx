'use client';

import { useEffect, useState } from 'react';

interface OpenDiagram {
  src: string;
  alt: string;
}

export default function DiagramLightbox() {
  const [diagram, setDiagram] = useState<OpenDiagram | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest<HTMLAnchorElement>('[data-diagram-lightbox]');
      if (!link) return;

      event.preventDefault();
      const img = link.closest('.mermaid-diagram')?.querySelector('img');
      setDiagram({
        src: link.href,
        alt: img?.getAttribute('alt') ?? 'Expanded architecture diagram',
      });
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (!diagram) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDiagram(null);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [diagram]);

  if (!diagram) return null;

  return (
    <div
      className="diagram-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Expanded diagram"
      onClick={() => setDiagram(null)}
    >
      <button
        className="diagram-lightbox-close"
        type="button"
        aria-label="Close expanded diagram"
        onClick={() => setDiagram(null)}
      >
        ×
      </button>
      <div className="diagram-lightbox-inner" onClick={(event) => event.stopPropagation()}>
        {/* Mermaid diagrams are remote SVG documents; next/image does not optimize SVGs here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={diagram.src} alt={diagram.alt} />
      </div>
    </div>
  );
}
