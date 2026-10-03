'use client';
import { usePathname } from 'next/navigation';

// The requested path, shown inside the 404 "agent trace".
export default function NotFoundTrace() {
  const path = usePathname() || '/';
  return (
    <div className="pf-404-term" aria-hidden="true">
      <div className="l"><span className="accent">›</span> navigate(&quot;{path}&quot;)</div>
      <div className="l d1 muted">✻ searching routes…</div>
      <div className="l d2 muted">  ✓ checked /work, /blog, /uses</div>
      <div className="l d3 err">✗ no route matched &quot;{path}&quot;</div>
      <div className="l d4">  suggesting closest matches ↓</div>
    </div>
  );
}
