import crypto from 'crypto';

function safeEqualHex(actualHex: string, expectedHex: string) {
  const actual = Buffer.from(actualHex, 'hex');
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function verifyAdminPassword(password: string) {
  const configured = process.env.ADMIN_PASSWORD_HASH ?? '';
  if (!configured) return false;

  if (configured.startsWith('scrypt:')) {
    const [, salt, expectedHex] = configured.split(':');
    if (!salt || !expectedHex) return false;
    const actualHex = crypto.scryptSync(password, salt, 64).toString('hex');
    return safeEqualHex(actualHex, expectedHex);
  }

  const expectedHex = configured.startsWith('sha256:') ? configured.slice('sha256:'.length) : configured;
  const actualHex = crypto.createHash('sha256').update(password).digest('hex');
  return /^[a-f0-9]+$/i.test(expectedHex) && safeEqualHex(actualHex, expectedHex);
}

export function hashAdminPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}
