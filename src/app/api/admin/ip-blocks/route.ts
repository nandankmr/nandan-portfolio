import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/session';
import { addIpBlock, listIpBlocks } from '@/lib/comments/db';

export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const blocks = await listIpBlocks();
  return NextResponse.json({ blocks: blocks.map((b) => ({ ...b, created_at: b.created_at.toISOString() })) });
}

export async function POST(req: NextRequest) {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const body = await req.json().catch(() => null) as { ip?: string; reason?: string } | null;
  const ip = body?.ip?.trim();
  if (!ip) return NextResponse.json({ error: 'ip required.' }, { status: 422 });
  const block = await addIpBlock(ip, body?.reason);
  return NextResponse.json({ block: { ...block, created_at: block.created_at.toISOString() } });
}
