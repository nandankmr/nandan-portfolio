import { NextRequest, NextResponse } from 'next/server';
import { createPost, getPublishedPosts, getDraftPosts, calcReadingTime, type CreatePostInput } from '@/lib/blog';

function auth(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? '';
  const token = header.replace(/^Bearer\s+/i, '');
  return token === process.env.BLOG_API_KEY;
}

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status');

  // Draft listing requires auth (drafts are not public)
  if (status === 'draft') {
    if (!auth(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    try {
      const posts = await getDraftPosts();
      return NextResponse.json({ posts });
    } catch (e) {
      console.error('[blog/posts GET drafts]', e);
      return NextResponse.json({ error: 'DB error.' }, { status: 500 });
    }
  }

  try {
    const posts = await getPublishedPosts();
    return NextResponse.json({ posts });
  } catch (e) {
    console.error('[blog/posts GET]', e);
    return NextResponse.json({ error: 'DB error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  let body: Partial<CreatePostInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  if (!body.slug?.trim()) return NextResponse.json({ error: 'slug required.' }, { status: 422 });
  if (!body.title?.trim()) return NextResponse.json({ error: 'title required.' }, { status: 422 });
  if (!body.description?.trim()) return NextResponse.json({ error: 'description required.' }, { status: 422 });
  if (!body.category?.trim()) return NextResponse.json({ error: 'category required.' }, { status: 422 });
  if (!body.date?.trim()) return NextResponse.json({ error: 'date required.' }, { status: 422 });
  if (!body.content?.trim()) return NextResponse.json({ error: 'content required.' }, { status: 422 });

  // Auto-calculate reading time if not provided
  if (!body.reading_time) {
    body.reading_time = calcReadingTime(body.content);
  }

  try {
    const post = await createPost(body as CreatePostInput);
    const origin = process.env.NEXT_PUBLIC_BLOG_ORIGIN ?? 'https://blog.nandankumar.com';
    const preview_url = `${origin}/preview/${post.id}?token=${post.preview_token}`;
    return NextResponse.json({ post, preview_url }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('unique')) return NextResponse.json({ error: 'Slug already exists.' }, { status: 409 });
    console.error('[blog/posts POST]', e);
    return NextResponse.json({ error: 'DB error.' }, { status: 500 });
  }
}
