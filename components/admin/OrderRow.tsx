import { FulfillmentMethod, OrderStatus } from '@/lib/types';
import StatusBadge from './StatusBadge';
import OrderActions from './OrderActions';

interface OrderRowProps {
  id: string;
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  total: number;
  trackingNumber: string | null;
  createdAt: string;
  onClick?: (orderId: string) => void;
  onTransition?: (orderId: string, toStatus: OrderStatus) => void;
}

function formatAge(isoDate: string): { text: string; urgent: boolean } {
  const ms = Date.now() - new Date(isoDate).getTime();
  const hours = ms / (1000 * 60 * 60);
  const days = hours / 24;

  if (hours < 1) {
    const mins = Math.floor(ms / (1000 * 60));
    return { text: `${mins}m`, urgent: false };
  }
  if (hours < 24) {
    return { text: `${Math.floor(hours)}h`, urgent: false };
  }
  if (days < 7) {
    return { text: `${Math.floor(days)}d`, urgent: days >= 1 };
  }
  return { text: `${Math.floor(days / 7)}w`, urgent: true };
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function OrderRow({
  id,
  status,
  fulfillmentMethod,
  customerName,
  customerEmail,
  itemCount,
  total,
  trackingNumber,
  createdAt,
  onClick,
  onTransition,
}: OrderRowProps) {
  const age = formatAge(createdAt);
  const isTerminal = status === 'completed' || status === 'cancelled';

  return (
    <tr
      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => onClick?.(id)}
    >
      {/* Order ID */}
      <td className="px-4 py-3">
        <span className="font-mono text-sm font-medium text-gray-900">{id}</span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={status} />
      </td>

      {/* Customer */}
      <td className="px-4 py-3">
        <div className="text-sm text-gray-900 font-medium">{customerName}</div>
        <div className="text-xs text-gray-500 truncate max-w-[180px]">{customerEmail}</div>
      </td>

      {/* Fulfillment */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          fulfillmentMethod === 'pickup'
            ? 'bg-green-50 text-green-700'
            : 'bg-blue-50 text-blue-700'
        }`}>
          {fulfillmentMethod === 'pickup' ? 'Pickup' : 'Ship'}
        </span>
        {trackingNumber && (
          <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[100px]" title={trackingNumber}>
            {trackingNumber}
          </div>
        )}
      </td>

      {/* Items */}
      <td className="px-4 py-3 text-sm text-gray-700 text-center">
        {itemCount}
      </td>

      {/* Total */}
      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
        {formatCents(total)}
      </td>

      {/* Date */}
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
        {formatDate(createdAt)}
      </td>

      {/* Age */}
      <td className="px-4 py-3 text-center">
        {!isTerminal && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            age.urgent
              ? 'bg-red-50 text-red-700 font-bold'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {age.text}
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        {onTransition && (
          <OrderActions
            orderId={id}
            status={status}
            fulfillmentMethod={fulfillmentMethod}
            onTransition={onTransition}
          />
        )}
      </td>
    </tr>
  );
}
