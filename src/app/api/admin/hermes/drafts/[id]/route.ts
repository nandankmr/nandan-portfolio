import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/admin/session';
import { discardPost, publishPost } from '@/lib/blog';
import { BLOG_ORIGIN } from '@/lib/hermes/config';
import { notifyPublished } from '@/lib/hermes/notify';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { action?: string } | null;
  if (body?.action !== 'publish' && body?.action !== 'discard') {
    return NextResponse.json({ error: 'action must be publish or discard.' }, { status: 422 });
  }

  const post = body.action === 'publish' ? await publishPost(id) : await discardPost(id);
  if (!post) return NextResponse.json({ error: 'Not found or not a draft.' }, { status: 404 });

  if (body.action === 'publish') {
    revalidatePath('/blog');
    revalidatePath(`/blog/${post.slug}`);
    notifyPublished(post.title, `${BLOG_ORIGIN}/${post.slug}`);
  }
  return NextResponse.json({ post });
}
