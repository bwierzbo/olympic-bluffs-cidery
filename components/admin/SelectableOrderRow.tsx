'use client';

import { OrderStatus, FulfillmentMethod } from '@/lib/types';

interface SelectableOrderRowProps {
  id: string;
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  total: number;
  trackingNumber: string | null;
  createdAt: string;
  selected: boolean;
  onSelect: (orderId: string) => void;
  onClick?: (orderId: string) => void;
  onTransition?: (orderId: string, toStatus: OrderStatus) => void;
}

export default function SelectableOrderRow({
  id,
  selected,
  onSelect,
  ...rowProps
}: SelectableOrderRowProps) {
  return (
    <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${selected ? 'bg-sage-50' : ''}`}>
      {/* Checkbox */}
      <td className="px-4 py-3 w-10">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 text-sage-600 border-gray-300 rounded focus:ring-sage-500"
        />
      </td>
      {/* Render the rest of the row content inline via OrderRow's cells */}
      <OrderRowCells id={id} {...rowProps} />
    </tr>
  );
}

/**
 * Renders just the td cells from OrderRow without the wrapping <tr>.
 * This is a lightweight extraction to avoid duplicating column logic.
 */
function OrderRowCells(props: Omit<SelectableOrderRowProps, 'selected' | 'onSelect'>) {
  // We render OrderRow as a fragment-returning component won't work since OrderRow returns <tr>.
  // Instead, we'll inline the cells directly here to keep rendering correct.
  const { id, status, fulfillmentMethod, customerName, customerEmail, itemCount, total, trackingNumber, createdAt, onClick, onTransition } = props;

  const age = formatAge(createdAt);
  const isTerminal = status === 'completed' || status === 'cancelled';

  return (
    <>
      <td className="px-4 py-3 cursor-pointer" onClick={() => onClick?.(id)}>
        <span className="font-mono text-sm font-medium text-gray-900">{id}</span>
      </td>
      <td className="px-4 py-3 cursor-pointer" onClick={() => onClick?.(id)}>
        <StatusBadgeInline status={status} />
      </td>
      <td className="px-4 py-3 cursor-pointer" onClick={() => onClick?.(id)}>
        <div className="text-sm text-gray-900 font-medium">{customerName}</div>
        <div className="text-xs text-gray-500 truncate max-w-[180px]">{customerEmail}</div>
      </td>
      <td className="px-4 py-3 cursor-pointer" onClick={() => onClick?.(id)}>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          fulfillmentMethod === 'pickup' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
        }`}>
          {fulfillmentMethod === 'pickup' ? 'Pickup' : 'Ship'}
        </span>
        {trackingNumber && (
          <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[100px]" title={trackingNumber}>
            {trackingNumber}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 text-center cursor-pointer" onClick={() => onClick?.(id)}>
        {itemCount}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right cursor-pointer" onClick={() => onClick?.(id)}>
        ${(total / 100).toFixed(2)}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap cursor-pointer" onClick={() => onClick?.(id)}>
        {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
      </td>
      <td className="px-4 py-3 text-center cursor-pointer" onClick={() => onClick?.(id)}>
        {!isTerminal && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            age.urgent ? 'bg-red-50 text-red-700 font-bold' : 'bg-gray-100 text-gray-600'
          }`}>
            {age.text}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {onTransition && (
          <ActionsInline id={id} status={status} fulfillmentMethod={fulfillmentMethod} onTransition={onTransition} />
        )}
      </td>
    </>
  );
}

// Inline helpers to avoid importing full components that return wrapping elements
import StatusBadge from './StatusBadge';
import OrderActions from './OrderActions';

function StatusBadgeInline({ status }: { status: OrderStatus }) {
  return <StatusBadge status={status} />;
}

function ActionsInline({ id, status, fulfillmentMethod, onTransition }: {
  id: string; status: OrderStatus; fulfillmentMethod: FulfillmentMethod; onTransition: (orderId: string, toStatus: OrderStatus) => void;
}) {
  return (
    <OrderActions orderId={id} status={status} fulfillmentMethod={fulfillmentMethod} onTransition={onTransition} />
  );
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
