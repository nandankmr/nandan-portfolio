import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/session';
import { getJob, reapStaleJobs } from '@/lib/hermes/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  await reapStaleJobs();
  const { id } = await params;
  const job = await getJob(id);
  if (!job) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return NextResponse.json({ job });
}
