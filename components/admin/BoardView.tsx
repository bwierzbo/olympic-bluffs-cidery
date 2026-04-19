'use client';

import { useMemo } from 'react';
import { OrderStatus } from '@/lib/types';
import type { OrderSummary } from '@/lib/hooks/useAdminOrders';
import BoardColumn from './BoardColumn';

interface BoardViewProps {
  orders: OrderSummary[];
  counts: Record<string, number>;
  loading: boolean;
  searchQuery: string;
  onOrderClick: (orderId: string) => void;
  onQuickTransition: (orderId: string, toStatus: OrderStatus) => void;
  onTransitionWithModal: (orderId: string, fromStatus: OrderStatus, toStatus: OrderStatus, fulfillmentMethod: string) => void;
}

const COLUMNS = [
  {
    key: 'new',
    title: 'New Orders',
    statuses: ['confirmed'] as OrderStatus[],
    accentColor: 'border-t-amber-400 bg-white',
  },
  {
    key: 'packing',
    title: 'Packing',
    statuses: ['processing'] as OrderStatus[],
    accentColor: 'border-t-blue-400 bg-white',
  },
  {
    key: 'readyShip',
    title: 'Ready / Shipped',
    statuses: ['ready', 'shipped'] as OrderStatus[],
    accentColor: 'border-t-green-400 bg-white',
  },
  {
    key: 'onHold',
    title: 'On Hold',
    statuses: ['on_hold'] as OrderStatus[],
    accentColor: 'border-t-orange-400 bg-white',
  },
];

export default function BoardView({
  orders,
  counts,
  loading,
  searchQuery,
  onOrderClick,
  onQuickTransition,
  onTransitionWithModal,
}: BoardViewProps) {
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  const grouped = useMemo(() => {
    const map: Record<string, OrderSummary[]> = {};
    for (const col of COLUMNS) {
      map[col.key] = filteredOrders.filter((o) =>
        col.statuses.includes(o.status)
      );
    }
    return map;
  }, [filteredOrders]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map((col) => (
        <BoardColumn
          key={col.key}
          title={col.title}
          count={
            searchQuery.trim()
              ? grouped[col.key].length
              : col.statuses.reduce((sum, s) => sum + (counts[s] || 0), 0)
          }
          accentColor={col.accentColor}
          orders={grouped[col.key]}
          loading={loading}
          onOrderClick={onOrderClick}
          onQuickTransition={onQuickTransition}
          onTransitionWithModal={onTransitionWithModal}
        />
      ))}
    </div>
  );
}
