import { OG_SIZE, ogCard } from '@/lib/og';

export const alt = 'Blog — Nandan Kumar';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return ogCard({ eyebrow: 'Blog', title: 'Notes from the build', sub: 'Essays on AI engineering, leadership, and full-stack systems.' });
}
