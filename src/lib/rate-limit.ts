import pool from '@/lib/db';

/**
 * DB-backed, per-IP rate limiting (shared across workers, survives restarts).
 * `isRateLimited` counts recent hits in a bucket; `recordHit` logs one.
 * Callers that should only count failures (e.g. login) call recordHit only on
 * failure; callers that count every attempt (contact/subscribe) record up front.
 */
export async function isRateLimited(
  bucket: string,
  ip: string,
  max: number,
  windowMs: number
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  try {
    const { rows } = await pool.query<{ c: number }>(
      `SELECT count(*)::int AS c FROM rate_limits WHERE bucket = $1 AND ip = $2 AND at > $3`,
      [bucket, ip, since]
    );
    return (rows[0]?.c ?? 0) >= max;
  } catch {
    // Fail open on a DB hiccup — don't lock out legitimate users.
    return false;
  }
}

export async function recordHit(bucket: string, ip: string): Promise<void> {
  try {
    await pool.query(`INSERT INTO rate_limits (bucket, ip) VALUES ($1, $2)`, [bucket, ip]);
    // Opportunistic prune so the table doesn't grow unbounded.
    if (Math.random() < 0.02) {
      await pool.query(`DELETE FROM rate_limits WHERE at < now() - interval '1 day'`);
    }
  } catch {
    // best-effort
  }
}
