import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getAdminSession } from '@/lib/admin/session';
import AdminDashboard from '@/components/admin/AdminDashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin — Nandan Kumar',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const host = (await headers()).get('host') ?? '';
  if (host.startsWith('blog.')) redirect('https://nandankumar.com/admin');
  if (!await getAdminSession()) redirect('/admin/login');
  return <AdminDashboard />;
}
