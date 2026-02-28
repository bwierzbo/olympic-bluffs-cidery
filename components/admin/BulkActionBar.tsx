'use client';

import { useState } from 'react';
import { OrderStatus } from '@/lib/types';
import { STATUS_CONFIG } from './StatusBadge';

interface BulkActionBarProps {
  selectionCount: number;
  commonTransitions: OrderStatus[];
  onBulkStatusUpdate: (status: OrderStatus, note?: string) => void;
  onExportCsv: () => void;
  onDeselectAll: () => void;
  updating: boolean;
  lastResult: { succeeded: string[]; failed: Array<{ orderId: string; error: string }> } | null;
  onClearResult: () => void;
}

const NOTE_REQUIRED: OrderStatus[] = ['on_hold', 'cancelled'];

export default function BulkActionBar({
  selectionCount,
  commonTransitions,
  onBulkStatusUpdate,
  onExportCsv,
  onDeselectAll,
  updating,
  lastResult,
  onClearResult,
}: BulkActionBarProps) {
  const [selectedAction, setSelectedAction] = useState<OrderStatus | ''>('');
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);

  if (selectionCount === 0) return null;

  const handleApply = () => {
    if (!selectedAction) return;
    const needsNote = NOTE_REQUIRED.includes(selectedAction);
    if (needsNote && !showNote) {
      setShowNote(true);
      return;
    }
    if (needsNote && !note.trim()) return;
    onBulkStatusUpdate(selectedAction, note.trim() || undefined);
    setSelectedAction('');
    setNote('');
    setShowNote(false);
  };

  const handleActionChange = (value: string) => {
    setSelectedAction(value as OrderStatus | '');
    setShowNote(false);
    setNote('');
  };

  return (
    <div className="sticky top-0 z-30 bg-sage-50 border border-sage-200 rounded-lg px-4 py-3 mb-4 shadow-sm">
      {/* Result banner */}
      {lastResult && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          {lastResult.succeeded.length > 0 && (
            <span className="text-green-700">
              {lastResult.succeeded.length} updated
            </span>
          )}
          {lastResult.failed.length > 0 && (
            <span className="text-red-700">
              {lastResult.failed.length} failed
            </span>
          )}
          {lastResult.failed.length > 0 && (
            <details className="inline text-xs text-red-600">
              <summary className="cursor-pointer">Details</summary>
              <ul className="mt-1 space-y-0.5">
                {lastResult.failed.map((f) => (
                  <li key={f.orderId}>
                    <span className="font-mono">{f.orderId}</span>: {f.error}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <button
            onClick={onClearResult}
            className="text-xs text-gray-500 hover:text-gray-700 ml-auto"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-sage-800">
          {selectionCount} order{selectionCount !== 1 ? 's' : ''} selected
        </span>

        <div className="flex items-center gap-2">
          {commonTransitions.length > 0 ? (
            <>
              <select
                value={selectedAction}
                onChange={(e) => handleActionChange(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
                disabled={updating}
              >
                <option value="">Bulk action...</option>
                {commonTransitions.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_CONFIG[status]?.label || status}
                  </option>
                ))}
              </select>
              <button
                onClick={handleApply}
                disabled={!selectedAction || updating}
                className="px-3 py-1.5 bg-sage-600 text-white rounded text-sm font-medium hover:bg-sage-700 disabled:opacity-50"
              >
                {updating ? 'Applying...' : 'Apply'}
              </button>
            </>
          ) : (
            <span className="text-xs text-gray-500 italic">
              No common actions for selected orders
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onExportCsv}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Export CSV
          </button>
          <button
            onClick={onDeselectAll}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Note input for on_hold/cancelled */}
      {showNote && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason (required)..."
            className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
            disabled={updating}
            autoFocus
          />
          <button
            onClick={handleApply}
            disabled={!note.trim() || updating}
            className="px-3 py-1.5 bg-sage-600 text-white rounded text-sm font-medium hover:bg-sage-700 disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}
