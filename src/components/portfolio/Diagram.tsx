'use client';
import { useState } from 'react';
import { DIAGRAMS, type DNode } from './diagrams';

const W = 150, H = 58;

// Connect the facing sides of two nodes with a smooth curve.
function path(a: DNode, b: DNode) {
  const ac = { x: a.x + W / 2, y: a.y + H / 2 }, bc = { x: b.x + W / 2, y: b.y + H / 2 };
  const dx = bc.x - ac.x, dy = bc.y - ac.y;
  if (Math.abs(dx) >= Math.abs(dy) * 1.2) {
    const s = { x: dx > 0 ? a.x + W : a.x, y: ac.y }, e = { x: dx > 0 ? b.x : b.x + W, y: bc.y };
    const m = (e.x - s.x) / 2;
    return `M${s.x} ${s.y}C${s.x + m} ${s.y} ${e.x - m} ${e.y} ${e.x} ${e.y}`;
  }
  const s = { x: ac.x, y: dy > 0 ? a.y + H : a.y }, e = { x: bc.x, y: dy > 0 ? b.y : b.y + H };
  const m = (e.y - s.y) / 2;
  return `M${s.x} ${s.y}C${s.x} ${s.y + m} ${e.x} ${e.y - m} ${e.x} ${e.y}`;
}

export default function Diagram({ id, compact }: { id: string; compact?: boolean }) {
  const spec = DIAGRAMS[id];
  const [hot, setHot] = useState<string | null>(null);
  if (!spec) return null;
  const byId = Object.fromEntries(spec.nodes.map((n) => [n.id, n]));
  // Fit the frame to the nodes, so compact diagrams don't float in empty space.
  const minX = Math.min(...spec.nodes.map((n) => n.x)) - 16, maxX = Math.max(...spec.nodes.map((n) => n.x)) + W + 16;
  const minY = Math.min(...spec.nodes.map((n) => n.y)) - 16, maxY = Math.max(...spec.nodes.map((n) => n.y)) + H + 16;
  const lit = (e: { from: string; to: string }) => !hot || e.from === hot || e.to === hot;

  return (
    <figure className={'pf-diagram' + (compact ? ' compact' : '')}>
      <figcaption><span>{spec.title}</span><span className="pf-diagram-note">simplified · hover a part</span></figcaption>
      <div className="pf-diagram-scroll">
        <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} role="img" aria-label={`${spec.title}: ${spec.nodes.map((n) => n.label).join(', ')}`}>
          {spec.edges.map((e, i) => {
            const d = path(byId[e.from], byId[e.to]);
            const dur = e.dur ?? 1.5;
            const on = lit(e);
            return (
              <g key={i} className={'pf-edge' + (on ? '' : ' dim') + (e.dashed ? ' dashed' : '')}>
                <path d={d} className="wire" />
                {e.label && (() => {
                  const a = byId[e.from], b = byId[e.to];
                  return <text className="pf-edge-label" x={(a.x + b.x) / 2 + W / 2} y={(a.y + b.y) / 2 + H / 2 - 8} textAnchor="middle">{e.label}</text>;
                })()}
                {[0, 1].map((k) => (
                  <circle key={k} r="4" className="pkt">
                    {/* Negative begin = already mid-flight, so no packet idles at the origin. */}
                    <animateMotion dur={`${dur}s`} begin={`-${(k * dur) / 2 + i * 0.17}s`} repeatCount="indefinite" path={d} />
                  </circle>
                ))}
                {e.both && (
                  <circle r="3.2" className="pkt back">
                    <animateMotion dur={`${dur * 1.1}s`} begin={`-${i * 0.23 + 0.4}s`} repeatCount="indefinite" path={d} keyPoints="1;0" keyTimes="0;1" calcMode="linear" />
                  </circle>
                )}
              </g>
            );
          })}
          {spec.nodes.map((n, i) => (
            <g
              key={n.id}
              className={`pf-node k-${n.kind ?? 'svc'}` + (hot === n.id ? ' hot' : '') + (hot && hot !== n.id && !spec.edges.some((e) => (e.from === hot && e.to === n.id) || (e.to === hot && e.from === n.id)) ? ' dim' : '')}
              transform={`translate(${n.x} ${n.y})`}
              style={{ '--i': i } as React.CSSProperties}
              onMouseEnter={() => setHot(n.id)}
              onMouseLeave={() => setHot(null)}
            >
              <rect width={W} height={H} rx="12" />
              <circle className="pip" cx="16" cy={H / 2} r="4" />
              <text x="28" y={n.sub ? 25 : 34} className="lbl">{n.label}</text>
              {n.sub && <text x="28" y="42" className="sub">{n.sub}</text>}
            </g>
          ))}
        </svg>
      </div>
    </figure>
  );
}
