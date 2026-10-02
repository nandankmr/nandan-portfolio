const isLocalEnv = process.env.NEXT_PUBLIC_APP_ENV === 'local' || process.env.NODE_ENV !== 'production';

const DEFAULT_SITE_ORIGIN = isLocalEnv ? 'http://localhost:3000' : 'https://nandankumar.com';
const DEFAULT_BLOG_ORIGIN = isLocalEnv ? 'http://localhost:3000/blog' : 'https://blog.nandankumar.com';

export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? DEFAULT_SITE_ORIGIN;
export const BLOG_ORIGIN = process.env.NEXT_PUBLIC_BLOG_ORIGIN ?? DEFAULT_BLOG_ORIGIN;
export const BLOG_LABEL = isLocalEnv ? new URL(BLOG_ORIGIN).host + new URL(BLOG_ORIGIN).pathname : 'blog.nandankumar.com';

export function blogUrl(path = '') {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${BLOG_ORIGIN}${normalized === '/' ? '' : normalized}`;
}

export function siteUrl(path = '') {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized === '/' ? '' : normalized}`;
}

export function postUrl(slug: string) {
  return blogUrl(`/${slug}`);
}

export function internalBlogPath(path = '') {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `/blog${normalized === '/' ? '' : normalized}`;
}

// Same view-transition name on a post's title in the index and on its page,
// so a cross-document navigation morphs one into the other.
export function postVT(slug: string) {
  return { viewTransitionName: `post-${slug.replace(/[^a-zA-Z0-9-]/g, '')}`, viewTransitionClass: 'pf-morph' } as React.CSSProperties;
}
