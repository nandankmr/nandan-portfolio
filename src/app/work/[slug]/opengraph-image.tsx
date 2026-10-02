import { WORK } from '@/components/portfolio/projects';
import { OG_SIZE, ogCard } from '@/lib/og';

export const alt = 'Case study by Nandan Kumar';
export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams() {
  return WORK.map((p) => ({ slug: p.id }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = WORK.find((w) => w.id === slug) ?? WORK[0];
  return ogCard({ eyebrow: `Case study · ${p.year} · ${p.tag}`, title: p.name, sub: p.summary, chips: p.stack });
}
