import type { Metadata } from 'next';
import BlogChrome from '@/components/blog/BlogChrome';
import BlogIndexClient from '@/components/blog/BlogIndexClient';
import { getAllPosts, getCategories, getFeaturedPost } from '@/lib/blog/posts';
import { blogUrl } from '@/lib/blog/urls';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog — Nandan Kumar',
  description: 'Essays on AI engineering, leadership, and full-stack systems by Nandan Kumar.',
  alternates: { canonical: blogUrl() },
  openGraph: {
    title: 'Blog — Nandan Kumar',
    description: 'Essays on AI engineering, leadership, and full-stack systems.',
    url: blogUrl(),
    siteName: 'Nandan Kumar',
    type: 'website',
  },
};

export default async function BlogPage() {
  const [posts, featured, categories] = await Promise.all([
    getAllPosts(),
    getFeaturedPost(),
    getCategories(),
  ]);

  return (
    <BlogChrome trail={<span className="curr">Blog — selected essays</span>}>
      <BlogIndexClient posts={posts} featured={featured ?? undefined} categories={categories} />
    </BlogChrome>
  );
}
