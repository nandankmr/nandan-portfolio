// Telegram notifications — notifications ONLY (no polling, no buttons).
// Uses the existing Hermes bot token. All sends are fire-and-forget and never
// throw into the caller.

import { HERMES_TG_BOT_TOKEN, HERMES_TG_CHAT_ID } from './config';

async function send(text: string): Promise<void> {
  if (!HERMES_TG_BOT_TOKEN || !HERMES_TG_CHAT_ID) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${HERMES_TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: HERMES_TG_CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error('[hermes/notify]', await res.text());
  } catch (e) {
    console.error('[hermes/notify]', (e as Error).message);
  }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Fire-and-forget — never blocks or throws into the job. */
export function notify(text: string): void {
  void send(text);
}

export function notifyTopicsReady(count: number, studioUrl: string): void {
  if (count <= 0) return;
  notify(`🔍 <b>${count} new topic${count === 1 ? '' : 's'}</b> ready in Studio\n${studioUrl}`);
}

export function notifyDraftReady(title: string, previewUrl: string): void {
  notify(`📝 <b>Draft ready</b>: ${esc(title)}\n${previewUrl}`);
}

export function notifyDraftFailed(topic: string, error: string): void {
  notify(`❌ <b>Draft failed</b>: ${esc(topic)}\n<code>${esc(error.slice(0, 300))}</code>`);
}

export function notifyPublished(title: string, url: string): void {
  notify(`✅ <b>Published</b>: ${esc(title)}\n${url}`);
}
