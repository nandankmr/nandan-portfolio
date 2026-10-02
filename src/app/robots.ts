import type { MetadataRoute } from 'next';
import { blogUrl, siteUrl } from '@/lib/blog/urls';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/'],
      },
    ],
    sitemap: [siteUrl('/sitemap.xml'), blogUrl('/sitemap.xml')],
  };
}
