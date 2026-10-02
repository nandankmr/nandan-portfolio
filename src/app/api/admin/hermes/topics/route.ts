import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/session';
import { listTopics } from '@/lib/hermes/db';
import type { TopicStatus } from '@/lib/hermes/types';

export const dynamic = 'force-dynamic';

const STATUSES = ['candidate', 'drafting', 'drafted', 'dismissed', 'all'];

export async function GET(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const raw = req.nextUrl.searchParams.get('status') ?? 'candidate';
  const status = (STATUSES.includes(raw) ? raw : 'candidate') as TopicStatus | 'all';
  const topics = await listTopics(status);
  return NextResponse.json({ topics });
}
