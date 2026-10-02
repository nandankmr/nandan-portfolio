import { SKILLS } from '@/lib/data';
import { brandOf, ToolIcon } from './icons';
import { toolKey } from './keys';
import { ToolChip } from './tools';

// Server component: the logo path data ships as HTML, not client JS.
export default function Stack() {
  const count = SKILLS.reduce((n, c) => n + c.items.length, 0);
  return (
    <section id="stack" className="pf-section">
      <div className="container">
        <div className="section-eyebrow" data-reveal>· Stack — {count} tools, each with a party trick</div>
        <h2 className="pf-h2" data-reveal>
          Boring tech, well chosen. <span className="muted">Hover anything — it does what it does.</span>
        </h2>
        <div className="pf-stack">
          {SKILLS.map((cat, i) => (
            <div key={cat.cat} className="pf-stack-row" data-reveal style={{ '--rev-delay': `${i * 60}ms` } as React.CSSProperties}>
              <div className="pf-stack-cat">
                <span className="pf-stack-name">{cat.cat}</span>
                <span className="pf-stack-take">{cat.take}</span>
              </div>
              <div className="pf-stack-tools">
                {cat.items.map((it) => {
                  const k = toolKey(it.name);
                  return <ToolChip key={it.name} name={it.name} years={it.years} k={k} icon={<ToolIcon k={k} />} {...brandOf(k)} />;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
