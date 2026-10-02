import PortfolioPage from '@/components/portfolio/PortfolioPage';
import Stack from '@/components/portfolio/Stack';
import type { PostCard } from '@/components/portfolio/Writing';
import { getPublishedPosts } from '@/lib/blog/posts';

// Static page, refreshed hourly so new posts show up without a redeploy.
export const revalidate = 3600;

async function latestPosts(): Promise<PostCard[]> {
  try {
    const posts = await getPublishedPosts();
    return posts
      .filter((p) => p.authoredBy !== 'hermes')
      .slice(0, 3)
      .map((p) => ({ slug: p.slug, title: p.title, dek: p.dek || p.description, date: p.publishedAt, readTime: p.readTime, category: p.category }));
  } catch {
    // DB down (or absent at build time): the page renders without "Writing".
    return [];
  }
}

export default async function Page() {
  return <PortfolioPage posts={await latestPosts()} stack={<Stack />} />;
}
