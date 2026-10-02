import { NextRequest, NextResponse } from 'next/server';
import { getClientIp } from '@/lib/comments/ip';
import { isRateLimited, recordHit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (await isRateLimited('subscribe', ip, 10, 60 * 60_000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required.' }, { status: 422 });
  }
  await recordHit('subscribe', ip);

  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    // Dev fallback — log and succeed
    console.log('[subscribe] (no BUTTONDOWN_API_KEY)', email);
    return NextResponse.json({ ok: true });
  }

  try {
    const res = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email_address: email, type: 'regular' }),
    });

    if (res.status === 201) return NextResponse.json({ ok: true });
    if (res.status === 400) {
      const data = await res.json();
      // Already subscribed is fine
      if (JSON.stringify(data).toLowerCase().includes('already')) {
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json({ error: 'Invalid email.' }, { status: 422 });
    }
    return NextResponse.json({ error: 'Subscribe failed.' }, { status: 500 });
  } catch (e) {
    console.error('[subscribe]', e);
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
