import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/session';
import { getTopic } from '@/lib/hermes/db';
import { startDraftJob } from '@/lib/hermes/jobs';

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { topicId?: string } | null;
  const topicId = body?.topicId?.trim();
  if (!topicId) return NextResponse.json({ error: 'topicId required.' }, { status: 422 });

  const topic = await getTopic(topicId);
  if (!topic) return NextResponse.json({ error: 'Topic not found.' }, { status: 404 });
  if (topic.status === 'drafting') {
    return NextResponse.json({ error: 'A draft is already in progress for this topic.' }, { status: 409 });
  }

  const job = await startDraftJob(topicId);
  return NextResponse.json({ jobId: job.id }, { status: 202 });
}
