'use client';

import { OrderStatus, FulfillmentMethod } from '@/lib/types';
import { getAllowedTransitions } from '@/lib/status-transitions';

interface OrderActionsProps {
  orderId: string;
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  onTransition: (orderId: string, toStatus: OrderStatus) => void;
}

const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  processing: 'Start Processing',
  ready: 'Mark Ready',
  shipped: 'Mark Shipped',
  completed: 'Complete',
  on_hold: 'Put On Hold',
  cancelled: 'Cancel',
  confirmed: 'Resume to Queue',
};

/** Labels specific to on_hold resume targets */
const RESUME_LABELS: Partial<Record<OrderStatus, string>> = {
  confirmed: 'Resume to Queue',
  processing: 'Resume Processing',
};

function getLabel(fromStatus: OrderStatus, toStatus: OrderStatus): string {
  if (fromStatus === 'on_hold' && RESUME_LABELS[toStatus]) {
    return RESUME_LABELS[toStatus]!;
  }
  return ACTION_LABELS[toStatus] || toStatus;
}

function getButtonStyle(toStatus: OrderStatus): string {
  if (toStatus === 'cancelled') {
    return 'text-red-600 hover:bg-red-50';
  }
  if (toStatus === 'on_hold') {
    return 'text-orange-600 hover:bg-orange-50';
  }
  if (toStatus === 'completed' || toStatus === 'ready' || toStatus === 'shipped') {
    return 'text-green-700 hover:bg-green-50';
  }
  return 'text-sage-700 hover:bg-sage-50';
}

export default function OrderActions({
  orderId,
  status,
  fulfillmentMethod,
  onTransition,
}: OrderActionsProps) {
  const allowed = getAllowedTransitions({ status, fulfillmentMethod });

  if (allowed.length === 0) return null;

  // Separate primary (forward) actions from secondary (hold/cancel) actions
  const primary = allowed.filter((s) => s !== 'on_hold' && s !== 'cancelled');
  const secondary = allowed.filter((s) => s === 'on_hold' || s === 'cancelled');

  return (
    <div className="flex items-center gap-1">
      {primary.map((toStatus) => (
        <button
          key={toStatus}
          onClick={(e) => {
            e.stopPropagation();
            onTransition(orderId, toStatus);
          }}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${getButtonStyle(toStatus)}`}
        >
          {getLabel(status, toStatus)}
        </button>
      ))}
      {secondary.length > 0 && (
        <div className="relative group">
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="More actions"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
          </button>
          <div className="absolute right-0 top-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10 hidden group-hover:block min-w-[140px]">
            {secondary.map((toStatus) => (
              <button
                key={toStatus}
                onClick={(e) => {
                  e.stopPropagation();
                  onTransition(orderId, toStatus);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors ${getButtonStyle(toStatus)}`}
              >
                {getLabel(status, toStatus)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
