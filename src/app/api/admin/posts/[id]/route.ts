import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/session';
import { setPostCommentsEnabled } from '@/lib/comments/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null) as { commentsEnabled?: boolean } | null;
  if (typeof body?.commentsEnabled !== 'boolean') {
    return NextResponse.json({ error: 'commentsEnabled boolean required.' }, { status: 422 });
  }
  const post = await setPostCommentsEnabled(id, body.commentsEnabled);
  if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  return NextResponse.json({ post });
}
