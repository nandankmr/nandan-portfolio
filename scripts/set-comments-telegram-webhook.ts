const token = process.env.COMMENTS_TG_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const siteOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? process.env.SITE_ORIGIN;

if (!token || !secret || !siteOrigin) {
  console.error('Required env: COMMENTS_TG_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, NEXT_PUBLIC_SITE_ORIGIN');
  process.exit(1);
}

const url = `${siteOrigin.replace(/\/$/, '')}/api/telegram/webhook/${secret}`;

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    url,
    secret_token: secret,
    allowed_updates: ['message', 'callback_query'],
  }),
});

console.log(await res.text());

export {};
