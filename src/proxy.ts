import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// blog.nandankumar.com/* → internally rewritten to /blog/*
// Nginx proxies the subdomain to localhost:3000 without any path rewrite;
// this proxy function handles the routing transparently (no browser redirect).
export function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/admin')) {
    if (host.startsWith('blog.')) {
      const url = request.nextUrl.clone();
      url.protocol = 'https';
      url.hostname = 'nandankumar.com';
      url.port = ''; // don't leak the internal :3000 into the public redirect
      return NextResponse.redirect(url, 308);
    }
  }

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!request.cookies.get('nk_admin_session')) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  if (host.startsWith('blog.')) {
    const url = request.nextUrl.clone();

    if (pathname.startsWith('/api/')) {
      return NextResponse.next();
    }

    // Canonicalize: a literal /blog prefix on the blog subdomain is a
    // duplicate URL. Redirect it to the clean root path so there's one
    // canonical address (e.g. blog.nandankumar.com/blog → blog.nandankumar.com/).
    if (pathname === '/blog' || pathname.startsWith('/blog/')) {
      url.pathname = pathname.slice('/blog'.length) || '/';
      return NextResponse.redirect(url, 308);
    }

    // Internal rewrite for clean URLs: blog.nandankumar.com/* → /blog/*
    url.pathname = '/blog' + (pathname === '/' ? '' : pathname);
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all paths except Next.js internals and static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.svg).*)'],
};
