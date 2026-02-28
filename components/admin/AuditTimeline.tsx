'use client';

import { OrderAuditEntry, OrderStatus } from '@/lib/types';
import StatusBadge from './StatusBadge';

interface AuditTimelineProps {
  entries: OrderAuditEntry[];
  loading: boolean;
}

const ACTION_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  status_change: { icon: 'arrow', color: 'bg-blue-500', label: 'Status changed' },
  tracking_added: { icon: 'truck', color: 'bg-indigo-500', label: 'Tracking added' },
  note_added: { icon: 'note', color: 'bg-gray-500', label: 'Note added' },
  bulk_status_change: { icon: 'arrow', color: 'bg-purple-500', label: 'Bulk status change' },
};

function ActionIcon({ action }: { action: string }) {
  const config = ACTION_CONFIG[action];
  const bgColor = config?.color || 'bg-gray-400';

  return (
    <div className={`flex-shrink-0 w-7 h-7 rounded-full ${bgColor} flex items-center justify-center`}>
      {action === 'tracking_added' ? (
        <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.143-.504 1.143-1.125v-3.375m-12-4.5V6.375a1.125 1.125 0 011.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v3.75m0 0h6.75" />
        </svg>
      ) : action === 'note_added' ? (
        <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      )}
    </div>
  );
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function SkeletonEntry() {
  return (
    <div className="flex gap-3 py-3">
      <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

export default function AuditTimeline({ entries, loading }: AuditTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-0 divide-y divide-gray-100">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonEntry key={i} />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">No activity recorded.</p>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-3.5 top-4 bottom-4 w-px bg-gray-200" />

      <div className="space-y-0">
        {entries.map((entry) => {
          const config = ACTION_CONFIG[entry.action];

          return (
            <div key={entry.id} className="relative flex gap-3 py-3">
              <ActionIcon action={entry.action} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-700">
                    {config?.label || entry.action}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTimestamp(entry.createdAt)}
                  </span>
                </div>

                {/* Status transition badges */}
                {entry.action === 'status_change' && entry.fromStatus && entry.toStatus && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <StatusBadge status={entry.fromStatus as OrderStatus} />
                    <svg className="h-3 w-3 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                    <StatusBadge status={entry.toStatus as OrderStatus} />
                  </div>
                )}

                {/* Tracking metadata */}
                {entry.action === 'tracking_added' && entry.metadata && (
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    {(entry.metadata as Record<string, string>).trackingNumber}
                  </p>
                )}

                {/* Note */}
                {entry.note && (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    &ldquo;{entry.note}&rdquo;
                  </p>
                )}

                {/* Actor */}
                <span className="text-xs text-gray-300 mt-0.5 block">
                  by {entry.actor}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
