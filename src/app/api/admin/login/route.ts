import { NextRequest, NextResponse } from 'next/server';
import { createAdminToken, adminCookieOptions } from '@/lib/admin/session';
import { verifyAdminPassword } from '@/lib/admin/password';
import { getClientIp } from '@/lib/comments/ip';
import { isRateLimited, recordHit } from '@/lib/rate-limit';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60_000;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (await isRateLimited('login', ip, MAX_ATTEMPTS, WINDOW_MS)) {
    return NextResponse.json({ error: 'Too many attempts.' }, { status: 429 });
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  if (!verifyAdminPassword(body.password ?? '')) {
    await recordHit('login', ip); // count failures only
    return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({ ...adminCookieOptions(), value: createAdminToken() });
  return res;
}
