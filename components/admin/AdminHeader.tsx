'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AdminHeaderProps {
  loading: boolean;
  onRefresh: () => void;
}

export default function AdminHeader({ loading, onRefresh }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // Continue with client-side logout even if API fails
    }
    router.push('/admin/orders');
    router.refresh();
  };

  return (
    <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600 mt-1">Manage and track all orders</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2 bg-sage-600 text-white rounded-md hover:bg-sage-700 disabled:opacity-50 text-sm font-medium"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
        <Link
          href="/"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium"
        >
          Back to Site
        </Link>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
