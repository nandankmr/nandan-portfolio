import { hashAdminPassword } from '../src/lib/admin/password';

const password = process.argv[2];
if (!password) {
  console.error('Usage: npx tsx scripts/hash-admin-password.ts "your-password"');
  process.exit(1);
}

console.log(hashAdminPassword(password));
