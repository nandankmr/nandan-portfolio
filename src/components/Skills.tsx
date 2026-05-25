'use client';
import { useState } from 'react';
import { SKILLS } from '@/lib/data';

type SkillItem = { name: string; years: number; projects: string[] };

function SkillCard({ cat, delay }: { cat: typeof SKILLS[number]; delay: number }) {
  const [active, setActive] = useState<string | null>(null);
  const item: SkillItem | undefined = active != null ? cat.items.find((x) => x.name === active) : undefined;

  return (
    <div className="skill-card" data-reveal style={{ '--rev-delay': `${delay}ms` } as React.CSSProperties}>
      <div className="skill-card-head">
        <div className="skill-cat-label">{cat.cat}</div>
        <div className="skill-cat-count">{cat.items.length}</div>
      </div>
      <p className="skill-take">{cat.take}</p>
      <div className="skill-list">
        {cat.items.map((it) => (
          <button
            key={it.name}
            type="button"
            className={'skill-chip' + (active === it.name ? ' active' : '')}
            onMouseEnter={() => setActive(it.name)}
            onMouseLeave={() => setActive((prev) => (prev === it.name ? null : prev))}
            onFocus={() => setActive(it.name)}
            onBlur={() => setActive(null)}
          >
            <span className="skill-chip-name">{it.name}</span>
            <span className="skill-chip-years">{it.years}y</span>
          </button>
        ))}
      </div>
      <div className="skill-detail">
        {item ? (
          <>
            <span className="skill-detail-name">{item.name}</span>
            <span className="skill-detail-sep">→</span>
            <span className="skill-detail-projects">{item.projects.join(' · ')}</span>
          </>
        ) : (
          <span className="skill-detail-hint">hover a tag for context</span>
        )}
      </div>
    </div>
  );
}

export default function Skills() {
  return (
    <section id="skills" className="skills">
      <div className="container">
        <div className="section-eyebrow" data-reveal>· Stack — what I reach for first</div>
        <h2 data-reveal style={{ marginBottom: 56, maxWidth: 800 }}>
          Boring tech, well chosen — plus the AI stack I&apos;ve gone deep on.
        </h2>
        <div className="skills-grid">
          {SKILLS.map((cat, i) => (
            <SkillCard key={cat.cat} cat={cat} delay={i * 60} />
          ))}
        </div>
      </div>
    </section>
  );
}
