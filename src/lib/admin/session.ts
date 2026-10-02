import crypto from 'crypto';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export const ADMIN_COOKIE = 'nk_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString('base64url');
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('ADMIN_SESSION_SECRET must be at least 32 characters.');
  return secret;
}

function sign(data: string) {
  return crypto.createHmac('sha256', getSessionSecret()).update(data).digest('base64url');
}

export function createAdminToken() {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({ sub: 'owner', exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }));
  const body = `${header}.${payload}`;
  return `${body}.${sign(body)}`;
}

export function verifyAdminToken(token?: string | null) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const body = `${parts[0]}.${parts[1]}`;
  const expected = sign(body);
  const actual = parts[2];
  if (actual.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) return false;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as { exp?: number; sub?: string };
    return payload.sub === 'owner' && typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function getAdminSession() {
  const store = await cookies();
  return verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
}

export function isAdminRequest(req: NextRequest) {
  return verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

export function adminCookieOptions() {
  return {
    name: ADMIN_COOKIE,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}
