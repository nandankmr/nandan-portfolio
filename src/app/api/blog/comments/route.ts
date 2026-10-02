import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/session';
import { createComment, getPostForComments, getPublicComments, getRecentCommentStats, resolveCommentParentId } from '@/lib/comments/db';
import { getClientIp, getUserAgent } from '@/lib/comments/ip';
import { commentsGloballyEnabled } from '@/lib/comments/settings';
import { notifyTelegramFireAndForget } from '@/lib/comments/telegram';
import { validateCommentInput } from '@/lib/comments/validation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('post') ?? '';
  const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get('limit') ?? 20)));
  const offset = Math.max(0, Number(req.nextUrl.searchParams.get('offset') ?? 0));

  if (!slug) return NextResponse.json({ error: 'post required.' }, { status: 422 });

  const { post, comments, total } = await getPublicComments(slug, limit, offset);
  if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

  return NextResponse.json({
    comments,
    total,
    hasMore: offset + comments.length < total,
    commentsEnabled: commentsGloballyEnabled() && post.comments_enabled,
  });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const isOwner = await getAdminSession();

  // Honeypot: bots fill the hidden `website` field. Return a success-shaped
  // response and silently drop, so a spammer can't detect the trap (don't 422).
  if (!isOwner && String(body.website ?? '').trim()) {
    return NextResponse.json({ ok: true, commentId: randomUUID() }, { status: 201 });
  }

  const slug = String(body.post ?? '').trim();
  if (!slug) return NextResponse.json({ error: 'post required.' }, { status: 422 });

  const post = await getPostForComments(slug);
  if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  if ((!commentsGloballyEnabled() || !post.comments_enabled) && !isOwner) {
    return NextResponse.json({ error: 'Comments are closed.' }, { status: 403 });
  }

  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);

  if (!isOwner) {
    const stats = await getRecentCommentStats(ip);
    if (stats.blocked) return NextResponse.json({ error: 'Unable to accept comment.' }, { status: 403 });
    if (stats.count10m >= 3) return NextResponse.json({ error: 'Slow down. Try again later.' }, { status: 429 });
    if (stats.lastAt && Date.now() - stats.lastAt.getTime() < 10_000) {
      return NextResponse.json({ error: 'Please wait a few seconds before commenting again.' }, { status: 429 });
    }
  }

  const parsed = validateCommentInput({
    authorName: isOwner ? 'Nandan Kumar' : body.authorName,
    authorEmail: isOwner ? null : body.authorEmail,
    body: body.body,
    website: body.website,
    parentId: body.parentId,
    isAuthor: isOwner,
  });
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 422 });

  const parentId = await resolveCommentParentId(post.id, parsed.parentId);
  if (parentId === undefined) return NextResponse.json({ error: 'Parent comment not found.' }, { status: 422 });

  const comment = await createComment({
    postId: post.id,
    parentId,
    authorName: isOwner ? 'Nandan Kumar' : parsed.authorName,
    authorEmail: parsed.authorEmail,
    body: parsed.body,
    isAuthor: isOwner,
    ip,
    userAgent,
  });

  notifyTelegramFireAndForget({
    id: comment.id,
    postTitle: post.title,
    postSlug: post.slug,
    authorName: comment.author_name,
    body: comment.body,
    ip,
  });

  return NextResponse.json({ ok: true, commentId: comment.id }, { status: 201 });
}
