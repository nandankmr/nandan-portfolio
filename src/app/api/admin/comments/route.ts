import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/session';
import { listAdminComments, listCommentPosts } from '@/lib/comments/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const post = req.nextUrl.searchParams.get('post') || undefined;
  const status = (req.nextUrl.searchParams.get('status') || 'all') as 'visible' | 'deleted' | 'all';
  const [comments, posts] = await Promise.all([
    listAdminComments({ post, status }),
    listCommentPosts(),
  ]);

  return NextResponse.json({
    comments: comments.map((comment) => ({
      id: comment.id,
      parentId: comment.parent_id,
      postSlug: comment.post_slug,
      postTitle: comment.post_title,
      authorName: comment.author_name,
      authorEmail: comment.author_email,
      body: comment.body,
      isAuthor: comment.is_author,
      status: comment.status,
      ip: comment.ip,
      userAgent: comment.user_agent,
      createdAt: comment.created_at.toISOString(),
    })),
    posts,
    commentsEnabled: process.env.COMMENTS_ENABLED !== 'false',
  });
}
