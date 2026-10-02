import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/session';
import { startReviseJob } from '@/lib/hermes/jobs';

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { draftPostId?: string; notes?: string } | null;
  const draftPostId = body?.draftPostId?.trim();
  const notes = body?.notes?.trim();
  if (!draftPostId) return NextResponse.json({ error: 'draftPostId required.' }, { status: 422 });
  if (!notes) return NextResponse.json({ error: 'notes required.' }, { status: 422 });

  const job = await startReviseJob(draftPostId, notes);
  return NextResponse.json({ jobId: job.id }, { status: 202 });
}
