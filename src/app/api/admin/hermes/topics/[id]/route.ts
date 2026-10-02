import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/session';
import { setTopicStatus } from '@/lib/hermes/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { action?: string } | null;
  if (body?.action !== 'dismiss') {
    return NextResponse.json({ error: 'action must be dismiss.' }, { status: 422 });
  }
  const topic = await setTopicStatus(id, 'dismissed');
  if (!topic) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return NextResponse.json({ topic });
}
