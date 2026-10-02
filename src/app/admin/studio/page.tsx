import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getAdminSession } from '@/lib/admin/session';
import StudioDashboard from '@/components/admin/StudioDashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Studio — Nandan Kumar',
  robots: { index: false, follow: false },
};

export default async function StudioPage() {
  const host = (await headers()).get('host') ?? '';
  if (host.startsWith('blog.')) redirect('https://nandankumar.com/admin/studio');
  if (!(await getAdminSession())) redirect('/admin/login');
  return <StudioDashboard />;
}
