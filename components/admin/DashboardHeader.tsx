'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type ViewMode = 'board' | 'list';
type SquareMode = 'sandbox' | 'production';

interface DashboardHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  attentionCount: number;
  loading: boolean;
  onRefresh: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function DashboardHeader({
  viewMode,
  onViewModeChange,
  attentionCount,
  loading,
  onRefresh,
  searchQuery,
  onSearchChange,
}: DashboardHeaderProps) {
  const router = useRouter();
  const [squareMode, setSquareMode] = useState<SquareMode | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetch('/api/admin/square-mode')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setSquareMode(data.mode); })
      .catch(() => {});
  }, []);

  const toggleSquareMode = async () => {
    if (!squareMode || switching) return;
    const newMode: SquareMode = squareMode === 'production' ? 'sandbox' : 'production';
    setSwitching(true);
    try {
      const res = await fetch('/api/admin/square-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      });
      if (res.ok) {
        const data = await res.json();
        setSquareMode(data.mode);
      }
    } catch { /* ignore */ }
    setSwitching(false);
  };

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
    <div className="mb-6 space-y-4">
      {/* Top row: title + actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          {attentionCount > 0 && (
            <p className="text-sm text-amber-700 mt-0.5">
              {attentionCount} order{attentionCount !== 1 ? 's' : ''} need{attentionCount === 1 ? 's' : ''} attention
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="inline-flex rounded-md border border-gray-300 bg-white">
            <button
              onClick={() => onViewModeChange('board')}
              className={`px-3 py-1.5 text-sm font-medium rounded-l-md transition-colors ${
                viewMode === 'board'
                  ? 'bg-sage-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="Board view"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded-r-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-sage-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="List view"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            </button>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-md bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            title="Refresh"
          >
            <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
            </svg>
          </button>

          <Link
            href="/"
            className="p-2 rounded-md bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            title="Back to site"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </Link>

          {squareMode && (
            <button
              onClick={toggleSquareMode}
              disabled={switching}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                squareMode === 'sandbox'
                  ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                  : 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100'
              } disabled:opacity-50`}
              title={`Click to switch to ${squareMode === 'production' ? 'sandbox' : 'production'} mode`}
            >
              {switching ? '...' : squareMode === 'sandbox' ? 'SANDBOX' : 'LIVE'}
            </button>
          )}

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search orders..."
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
