import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getClientIp } from '@/lib/comments/ip';
import { isRateLimited, recordHit } from '@/lib/rate-limit';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Lazily constructed so the build doesn't fail without a key
let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!);
  return _resend;
}

const TO_EMAIL = 'nandankmrjha@gmail.com';
const FROM_EMAIL = process.env.FROM_EMAIL ?? 'contact@nandankumar.com';

interface ContactPayload {
  name: string;
  email: string;
  company?: string;
  message: string;
  website?: string; // honeypot
  captchaToken?: string;
}

function validate(body: Partial<ContactPayload>): string | null {
  if (!body.name?.trim()) return 'Name is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email?.trim() ?? ''))
    return 'Valid email is required.';
  if ((body.message?.trim().length ?? 0) < 10) return 'Message is too short.';
  return null;
}

/* ── Cloudflare Turnstile verification ────────────────────────────── */

async function verifyCaptcha(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Skip in dev when no secret is configured

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = await res.json() as { success: boolean };
    return data.success === true;
  } catch (e) {
    console.error('[contact] Turnstile verification error:', e);
    // Fail open so a Cloudflare outage doesn't lock the form
    return true;
  }
}

function buildHtml(b: ContactPayload) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: 'Inter', system-ui, sans-serif; background: #f6f3eb; margin: 0; padding: 32px 16px; }
    .card { max-width: 560px; margin: 0 auto; background: #fbf8ef; border: 1px solid #d8d3c2; border-radius: 14px; overflow: hidden; }
    .header { background: #14140e; padding: 28px 32px; }
    .header h1 { color: #f6f3eb; font-size: 18px; font-weight: 500; margin: 0; letter-spacing: -0.02em; }
    .header p { color: #6b6a5f; font-size: 12px; margin: 6px 0 0; font-family: monospace; letter-spacing: 0.06em; text-transform: uppercase; }
    .body { padding: 28px 32px; }
    .row { margin-bottom: 20px; }
    .label { font-family: monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #6b6a5f; margin-bottom: 4px; }
    .value { font-size: 15px; color: #14140e; line-height: 1.5; }
    .value a { color: #ff5b2e; text-decoration: none; }
    .message { background: #f6f3eb; border: 1px solid #d8d3c2; border-radius: 8px; padding: 16px; font-size: 15px; line-height: 1.65; color: #14140e; white-space: pre-wrap; }
    .footer { padding: 16px 32px; border-top: 1px solid #d8d3c2; font-family: monospace; font-size: 11px; color: #6b6a5f; letter-spacing: 0.06em; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>New portfolio contact</h1>
      <p>${new Date().toUTCString()}</p>
    </div>
    <div class="body">
      <div class="row">
        <div class="label">From</div>
        <div class="value">${esc(b.name)} &mdash; <a href="mailto:${esc(b.email)}">${esc(b.email)}</a></div>
      </div>
      ${b.company ? `
      <div class="row">
        <div class="label">Company / Role</div>
        <div class="value">${esc(b.company)}</div>
      </div>` : ''}
      <div class="row">
        <div class="label">Message</div>
        <div class="message">${esc(b.message)}</div>
      </div>
    </div>
    <div class="footer">nandankumar.com portfolio · reply directly to this email to respond</div>
  </div>
</body>
</html>`.trim();
}

export async function POST(req: NextRequest) {
  let body: Partial<ContactPayload>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  // Honeypot — bots fill the hidden `website` field. Pretend success, drop.
  if (body.website && String(body.website).trim()) {
    return NextResponse.json({ ok: true });
  }

  // CAPTCHA verification (before rate-limit so bots don't pollute the bucket)
  const ip = getClientIp(req);
  const token = body.captchaToken;
  if (process.env.TURNSTILE_SECRET_KEY && (!token || !(await verifyCaptcha(token, ip)))) {
    return NextResponse.json({ error: 'CAPTCHA verification failed. Please try again.' }, { status: 403 });
  }

  // Rate limit: 5 messages / 10 min per IP.
  if (await isRateLimited('contact', ip, 5, 10 * 60_000)) {
    return NextResponse.json({ error: 'Too many messages. Try again later.' }, { status: 429 });
  }

  const err = validate(body);
  if (err) return NextResponse.json({ error: err }, { status: 422 });

  await recordHit('contact', ip);

  const payload = body as ContactPayload;

  if (!process.env.RESEND_API_KEY) {
    // Dev fallback — log and succeed so the UI works without a key
    console.log('[contact] (no RESEND_API_KEY — logging only)', payload);
    return NextResponse.json({ ok: true });
  }

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: payload.email,
      subject: `Portfolio contact: ${payload.name}${payload.company ? ` / ${payload.company}` : ''}`,
      html: buildHtml(payload),
      text: [
        `From: ${payload.name} <${payload.email}>`,
        payload.company ? `Company: ${payload.company}` : '',
        '',
        payload.message,
      ]
        .filter(Boolean)
        .join('\n'),
    });

    if (error) {
      console.error('[contact] Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
    }
  } catch (e) {
    console.error('[contact] Unexpected error:', e);
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
