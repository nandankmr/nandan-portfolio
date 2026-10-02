import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/session';
import { removeIpBlock } from '@/lib/comments/db';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ ip: string }> }
) {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { ip } = await params;
  await removeIpBlock(decodeURIComponent(ip));
  return NextResponse.json({ ok: true });
}
