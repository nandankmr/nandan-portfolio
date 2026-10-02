import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin/session';
import AdminLogin from '@/components/admin/AdminLogin';

export const metadata: Metadata = {
  title: 'Admin — Nandan Kumar',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect('/admin');
  return <AdminLogin />;
}
