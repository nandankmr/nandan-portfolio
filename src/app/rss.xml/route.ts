import { getPublishedPosts } from '@/lib/blog/posts';
import { blogUrl, postUrl } from '@/lib/blog/urls';

export const dynamic = 'force-dynamic';

export async function GET() {
  const posts = await getPublishedPosts();

  const items = posts
    .map((post) => `
      <item>
        <title><![CDATA[${post.title}]]></title>
        <description><![CDATA[${post.description}]]></description>
        <link>${postUrl(post.slug)}</link>
        <guid>${postUrl(post.slug)}</guid>
        <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      </item>
    `)
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title>Nandan Kumar — Writing</title>
        <description>Essays on AI engineering, leadership, and full-stack systems.</description>
        <link>${blogUrl()}</link>
        ${items}
      </channel>
    </rss>`;

  return new Response(xml.trim(), {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
  });
}
