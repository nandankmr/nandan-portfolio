import { OG_SIZE, ogCard } from '@/lib/og';

export const alt = 'Nandan Kumar — Senior Full-stack & AI Engineer';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return ogCard({
    eyebrow: 'Senior full-stack & AI engineer',
    title: 'Nandan Kumar',
    sub: 'I build AI systems that pick up the phone, and the unglamorous infrastructure that keeps them honest.',
    chips: ['Voice agents', 'LangGraph', 'TypeScript', 'Node.js', 'React', 'AWS'],
  });
}
