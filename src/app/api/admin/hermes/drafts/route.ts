import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin/session';
import { getDraftPosts } from '@/lib/blog';
import { BLOG_ORIGIN } from '@/lib/hermes/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const posts = await getDraftPosts();
  const drafts = posts.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    dek: p.dek,
    category: p.category,
    readingTime: p.reading_time,
    authoredBy: p.authored_by,
    updatedAt: p.updated_at,
    previewUrl: `${BLOG_ORIGIN}/preview/${p.id}?token=${p.preview_token ?? ''}`,
  }));
  return NextResponse.json({ drafts });
}
