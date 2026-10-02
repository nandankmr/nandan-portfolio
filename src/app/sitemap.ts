import type { MetadataRoute } from 'next';
import { getPublishedPosts } from '@/lib/blog/posts';
import { blogUrl, postUrl, siteUrl } from '@/lib/blog/urls';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();
  return [
    { url: siteUrl(), lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: blogUrl(), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    ...posts.map((post) => ({
      url: postUrl(post.slug),
      lastModified: new Date(post.updatedAt ?? post.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: post.featured ? 0.85 : 0.7,
    })),
  ];
}
