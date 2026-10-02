import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/session';
import { startDiscoverJob } from '@/lib/hermes/jobs';

export async function POST() {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const job = await startDiscoverJob();
  return NextResponse.json({ jobId: job.id }, { status: 202 });
}
