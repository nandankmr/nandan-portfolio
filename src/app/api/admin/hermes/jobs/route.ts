import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/session';
import { listActiveJobs, reapStaleJobs } from '@/lib/hermes/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  await reapStaleJobs();
  const jobs = await listActiveJobs();
  return NextResponse.json({ jobs });
}
