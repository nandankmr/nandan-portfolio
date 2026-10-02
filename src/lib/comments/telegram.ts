import { setTelegramMessageId } from './db';

interface NotifyInput {
  id: string;
  postTitle: string;
  postSlug: string;
  authorName: string;
  body: string;
  ip: string;
}

function telegramConfigured() {
  return Boolean(process.env.COMMENTS_TG_BOT_TOKEN && process.env.COMMENTS_TG_CHAT_ID);
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function sendTelegramCommentNotification(input: NotifyInput) {
  if (!telegramConfigured()) return;

  const chatId = process.env.COMMENTS_TG_CHAT_ID!;
  const token = process.env.COMMENTS_TG_BOT_TOKEN!;
  const text = [
    '<b>New blog comment</b>',
    `<b>Post:</b> ${escapeHtml(input.postTitle)}`,
    `<b>Author:</b> ${escapeHtml(input.authorName)}`,
    `<b>IP:</b> <code>${escapeHtml(input.ip)}</code>`,
    '',
    escapeHtml(input.body.slice(0, 1200)),
  ].join('\n');

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Delete', callback_data: `delete:${input.id}` },
            { text: 'Reply', callback_data: `reply:${input.id}` },
          ],
        ],
      },
    }),
  });

  if (!res.ok) {
    console.error('[comments telegram notify]', await res.text());
    return;
  }

  const data = await res.json() as { result?: { message_id?: number } };
  if (data.result?.message_id) await setTelegramMessageId(input.id, data.result.message_id);
}

export function notifyTelegramFireAndForget(input: NotifyInput) {
  sendTelegramCommentNotification(input).catch((error) => {
    console.error('[comments telegram fire-and-forget]', error);
  });
}

export async function telegramAnswerCallback(callbackQueryId: string, text?: string) {
  const token = process.env.COMMENTS_TG_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  }).catch((error) => console.error('[telegram answer callback]', error));
}

export async function telegramSendForceReply(chatId: number | string, replyToMessageId: number, commentId: string) {
  const token = process.env.COMMENTS_TG_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      reply_to_message_id: replyToMessageId,
      text: `Reply to comment ${commentId}`,
      reply_markup: {
        force_reply: true,
        selective: true,
      },
    }),
  }).catch((error) => console.error('[telegram force reply]', error));
}
