import type { Metadata } from 'next';
import AdminNav from '@/components/admin/AdminNav';

export const metadata: Metadata = {
  title: 'Admin · Olympic Bluffs',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      {children}
    </div>
  );
}
