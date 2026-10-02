import { NextRequest, NextResponse } from 'next/server';
import { getPostById, publishPost, discardPost, updateDraftPost, type UpdatePostInput } from '@/lib/blog';
import { revalidatePath } from 'next/cache';

function auth(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? '';
  const token = header.replace(/^Bearer\s+/i, '');
  return token === process.env.BLOG_API_KEY;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const post = await getPostById(id);
    if (!post) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json({ post });
  } catch (e) {
    console.error('[blog/posts/:id GET]', e);
    return NextResponse.json({ error: 'DB error.' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  let body: { action?: string } & UpdatePostInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const action = body.action;
  if (action !== 'publish' && action !== 'discard' && action !== 'update') {
    return NextResponse.json({ error: 'action must be "publish", "discard", or "update".' }, { status: 422 });
  }

  try {
    if (action === 'update') {
      const post = await updateDraftPost(id, {
        title: body.title,
        description: body.description,
        dek: body.dek,
        category: body.category,
        tags: body.tags,
        reading_time: body.reading_time,
        toc: body.toc,
        content: body.content,
      });
      if (!post) return NextResponse.json({ error: 'Post not found or not in draft state.' }, { status: 404 });
      return NextResponse.json({ post });
    }

    const post = action === 'publish' ? await publishPost(id) : await discardPost(id);
    if (!post) return NextResponse.json({ error: 'Post not found or not in draft state.' }, { status: 404 });

    if (action === 'publish') {
      revalidatePath('/blog');
      revalidatePath(`/blog/${post.slug}`);
    }

    return NextResponse.json({ post });
  } catch (e) {
    console.error('[blog/posts/:id PATCH]', e);
    return NextResponse.json({ error: 'DB error.' }, { status: 500 });
  }
}
