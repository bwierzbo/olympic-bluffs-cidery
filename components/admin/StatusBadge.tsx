import { OrderStatus } from '@/lib/types';

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  confirmed: { label: 'New Order', className: 'bg-amber-100 text-amber-800' },
  on_hold: { label: 'On Hold', className: 'bg-orange-100 text-orange-800' },
  processing: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
  ready: { label: 'Ready', className: 'bg-purple-100 text-purple-800' },
  shipped: { label: 'Shipped', className: 'bg-indigo-100 text-indigo-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
};

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-800' };
  const sizeClass = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center rounded-full font-semibold whitespace-nowrap ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG };
