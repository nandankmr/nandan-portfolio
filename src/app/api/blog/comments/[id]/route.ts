import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/session';
import { updateCommentStatus } from '@/lib/comments/db';

function hasTelegramSecret(req: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const header = req.headers.get('x-telegram-bot-api-secret-token');
  return Boolean(expected && header && header === expected);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const allowed = await getAdminSession() || hasTelegramSecret(req);
  if (!allowed) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  if (body.action !== 'delete' && body.action !== 'restore') {
    return NextResponse.json({ error: 'action must be delete or restore.' }, { status: 422 });
  }

  const post = await updateCommentStatus(id, body.action === 'delete' ? 'deleted' : 'visible');
  if (!post) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  return NextResponse.json({ ok: true, comment: post });
}
