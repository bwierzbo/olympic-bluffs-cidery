'use client';

import { OrderStatus } from '@/lib/types';

const COUNTER_STATUSES: { status: OrderStatus; label: string; className: string; activeClassName: string }[] = [
  { status: 'confirmed', label: 'New', className: 'bg-amber-50 text-amber-700 border-amber-200', activeClassName: 'ring-2 ring-amber-400' },
  { status: 'on_hold', label: 'On Hold', className: 'bg-orange-50 text-orange-700 border-orange-200', activeClassName: 'ring-2 ring-orange-400' },
  { status: 'processing', label: 'In Progress', className: 'bg-blue-50 text-blue-700 border-blue-200', activeClassName: 'ring-2 ring-blue-400' },
  { status: 'ready', label: 'Ready', className: 'bg-purple-50 text-purple-700 border-purple-200', activeClassName: 'ring-2 ring-purple-400' },
  { status: 'shipped', label: 'Shipped', className: 'bg-indigo-50 text-indigo-700 border-indigo-200', activeClassName: 'ring-2 ring-indigo-400' },
];

interface StatusCountersProps {
  counts: Record<string, number>;
  activeStatus?: string;
  onStatusClick: (status: string | undefined) => void;
}

export default function StatusCounters({ counts, activeStatus, onStatusClick }: StatusCountersProps) {
  const totalActive = COUNTER_STATUSES.reduce((sum, s) => sum + (counts[s.status] || 0), 0);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={() => onStatusClick(undefined)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
          !activeStatus
            ? 'bg-sage-50 text-sage-700 border-sage-300 ring-2 ring-sage-400'
            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
        }`}
      >
        All Active
        <span className="font-bold">{totalActive}</span>
      </button>
      {COUNTER_STATUSES.map(({ status, label, className, activeClassName }) => {
        const count = counts[status] || 0;
        const isActive = activeStatus === status;

        return (
          <button
            key={status}
            onClick={() => onStatusClick(isActive ? undefined : status)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${className} ${
              isActive ? activeClassName : 'hover:opacity-80'
            }`}
          >
            {label}
            <span className="font-bold">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
