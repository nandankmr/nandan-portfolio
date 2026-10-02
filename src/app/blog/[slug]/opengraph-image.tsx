import { getPostBySlug } from '@/lib/blog/posts';
import { OG_SIZE, ogCard } from '@/lib/og';

export const alt = 'Post by Nandan Kumar';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const dynamic = 'force-dynamic'; // posts live in Postgres, like the page itself

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug).catch(() => null);
  if (!post) return ogCard({ eyebrow: 'Blog', title: 'Notes from the build' });
  const { meta } = post;
  return ogCard({ eyebrow: `${meta.category} · ${meta.readTime}`, title: meta.title, sub: meta.dek || meta.description });
}
