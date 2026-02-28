'use client';

import { useState } from 'react';
import { OrderStatus } from '@/lib/types';
import StatusBadge from './StatusBadge';

interface StatusTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { note?: string; trackingNumber?: string }) => void;
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  fulfillmentMethod: string;
  updating: boolean;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  confirmed: 'New Order',
  on_hold: 'On Hold',
  processing: 'In Progress',
  ready: 'Ready for Pickup',
  shipped: 'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function StatusTransitionModal({
  isOpen,
  onClose,
  onConfirm,
  orderId,
  fromStatus,
  toStatus,
  fulfillmentMethod,
  updating,
}: StatusTransitionModalProps) {
  const [note, setNote] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  if (!isOpen) return null;

  const noteRequired = toStatus === 'on_hold' || toStatus === 'cancelled';
  const showTracking = toStatus === 'shipped' && fulfillmentMethod === 'shipping';
  const isDangerous = toStatus === 'cancelled';

  const canSubmit = !updating && (!noteRequired || note.trim().length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onConfirm({
      note: note.trim() || undefined,
      trackingNumber: trackingNumber.trim() || undefined,
    });
    setNote('');
    setTrackingNumber('');
  };

  const handleClose = () => {
    if (updating) return;
    setNote('');
    setTrackingNumber('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isDangerous ? 'Cancel Order' : 'Update Status'}
        </h3>

        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
          <span className="font-mono font-medium text-gray-900">{orderId}</span>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <StatusBadge status={fromStatus} />
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
          <StatusBadge status={toStatus} />
        </div>

        <form onSubmit={handleSubmit}>
          {showTracking && (
            <div className="mb-4">
              <label htmlFor="tracking" className="block text-sm font-medium text-gray-700 mb-1">
                Tracking Number (optional)
              </label>
              <input
                type="text"
                id="tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g., 1Z999AA10123456784"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
              />
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
              {noteRequired ? 'Reason (required)' : 'Note (optional)'}
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                toStatus === 'on_hold'
                  ? 'e.g., Customer requested delay, address correction needed...'
                  : toStatus === 'cancelled'
                    ? 'e.g., Customer requested cancellation, out of stock...'
                    : 'Add a note about this status change...'
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 resize-none"
            />
            {noteRequired && note.trim().length === 0 && (
              <p className="mt-1 text-xs text-red-500">A reason is required for this action.</p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={updating}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`px-4 py-2 text-white rounded-md text-sm font-medium disabled:opacity-50 ${
                isDangerous
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-sage-600 hover:bg-sage-700'
              }`}
            >
              {updating ? 'Updating...' : `${STATUS_LABELS[toStatus] || toStatus}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
