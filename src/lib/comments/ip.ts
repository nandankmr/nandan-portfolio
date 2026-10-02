import type { NextRequest } from 'next/server';

export function getClientIp(req: NextRequest) {
  // Trust ONLY `X-Real-IP`, which nginx sets to the true client IP. The site
  // sits behind Cloudflare, so nginx is configured with the real_ip module
  // (set_real_ip_from <CF ranges>; real_ip_header CF-Connecting-IP) — that makes
  // $remote_addr (and thus X-Real-IP) the real visitor for requests arriving via
  // Cloudflare, and the actual peer for any direct-to-origin request. Either way
  // it is NOT client-spoofable. We deliberately ignore `cf-connecting-ip` and the
  // leftmost X-Forwarded-For entry here, since those are forgeable on a direct
  // origin hit. (See /etc/nginx/conf.d/cloudflare-realip.conf on the server.)
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const hops = forwarded.split(',').map((h) => h.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }

  return '0.0.0.0';
}

export function getUserAgent(req: NextRequest) {
  return (req.headers.get('user-agent') ?? '').slice(0, 1000);
}
