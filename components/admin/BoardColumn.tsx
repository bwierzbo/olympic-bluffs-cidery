'use client';

import { OrderStatus, FulfillmentMethod } from '@/lib/types';
import OrderCard from './OrderCard';

interface BoardOrder {
  id: string;
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  customerName: string;
  itemCount: number;
  total: number;
  createdAt: string;
}

interface BoardColumnProps {
  title: string;
  count: number;
  accentColor: string;
  orders: BoardOrder[];
  loading: boolean;
  onOrderClick: (orderId: string) => void;
  onQuickTransition: (orderId: string, toStatus: OrderStatus) => void;
  onTransitionWithModal: (orderId: string, fromStatus: OrderStatus, toStatus: OrderStatus, fulfillmentMethod: string) => void;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="flex gap-2 mb-3">
        <div className="h-4 bg-gray-200 rounded w-14" />
        <div className="h-4 bg-gray-200 rounded w-10" />
      </div>
      <div className="flex justify-between">
        <div className="h-4 bg-gray-200 rounded w-20" />
        <div className="h-6 bg-gray-200 rounded w-24" />
      </div>
    </div>
  );
}

export default function BoardColumn({
  title,
  count,
  accentColor,
  orders,
  loading,
  onOrderClick,
  onQuickTransition,
  onTransitionWithModal,
}: BoardColumnProps) {
  return (
    <div className="flex flex-col min-w-[280px] w-full">
      {/* Column header */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-t-lg border-t-3 ${accentColor}`}>
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gray-100 text-xs font-bold text-gray-600">
          {count}
        </span>
      </div>

      {/* Card list */}
      <div className="flex-1 bg-gray-50 rounded-b-lg p-2 space-y-2 min-h-[120px]">
        {loading && orders.length === 0 ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : orders.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-xs text-gray-400">
            No orders
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              id={order.id}
              status={order.status}
              fulfillmentMethod={order.fulfillmentMethod}
              customerName={order.customerName}
              itemCount={order.itemCount}
              total={order.total}
              createdAt={order.createdAt}
              onClick={onOrderClick}
              onQuickTransition={onQuickTransition}
              onTransitionWithModal={onTransitionWithModal}
            />
          ))
        )}
      </div>
    </div>
  );
}
