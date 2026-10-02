import { NextRequest, NextResponse } from 'next/server';
import { createComment, getCommentById, getCommentByTelegramMessage, updateCommentStatus } from '@/lib/comments/db';
import { telegramAnswerCallback, telegramSendForceReply } from '@/lib/comments/telegram';

function allowedChat(chatId?: number) {
  if (!chatId) return false;
  const allowed = (process.env.COMMENTS_TG_CHAT_ID ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  return allowed.includes(String(chatId));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || secret !== expected || req.headers.get('x-telegram-bot-api-secret-token') !== expected) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const update = await req.json();

  const callback = update.callback_query;
  if (callback) {
    const chatId = callback.message?.chat?.id;
    if (!allowedChat(chatId)) return NextResponse.json({ ok: true });

    const [action, commentId] = String(callback.data ?? '').split(':');
    if (action === 'delete' && commentId) {
      await updateCommentStatus(commentId, 'deleted');
      await telegramAnswerCallback(callback.id, 'Comment deleted');
    }
    if (action === 'reply' && commentId && callback.message?.message_id) {
      await telegramSendForceReply(chatId, callback.message.message_id, commentId);
      await telegramAnswerCallback(callback.id, 'Reply to the next prompt');
    }
    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  if (message?.reply_to_message?.message_id && message.text && allowedChat(message.chat?.id)) {
    const parent = await getCommentByTelegramMessage(message.reply_to_message.message_id);
    if (parent) {
      await createComment({
        postId: parent.post_id,
        parentId: parent.parent_id ?? parent.id,
        authorName: 'Nandan Kumar',
        authorEmail: null,
        body: String(message.text).trim().slice(0, 3000),
        isAuthor: true,
        ip: 'telegram',
        userAgent: 'telegram-webhook',
      });
    } else {
      const text = String(message.reply_to_message.text ?? '');
      const match = text.match(/Reply to comment ([0-9a-f-]{36})/i);
      if (match?.[1]) {
        const comment = await getCommentById(match[1]);
        if (comment) {
          await createComment({
            postId: comment.post_id,
            parentId: comment.parent_id ?? comment.id,
            authorName: 'Nandan Kumar',
            authorEmail: null,
            body: String(message.text).trim().slice(0, 3000),
            isAuthor: true,
            ip: 'telegram',
            userAgent: 'telegram-webhook',
          });
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
