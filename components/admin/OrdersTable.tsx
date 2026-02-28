'use client';

import { OrderStatus } from '@/lib/types';
import OrderRow from './OrderRow';
import SelectableOrderRow from './SelectableOrderRow';
import Pagination from './Pagination';
import BulkActionBar from './BulkActionBar';
import type { OrderSummary } from '@/lib/hooks/useAdminOrders';

interface OrdersTableProps {
  orders: OrderSummary[];
  loading: boolean;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onOrderClick?: (orderId: string) => void;
  onTransition?: (orderId: string, toStatus: OrderStatus) => void;
  // Bulk selection
  selectionEnabled?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (orderId: string) => void;
  onSelectAll?: (orderIds: string[]) => void;
  onDeselectAll?: () => void;
  // Bulk actions
  commonTransitions?: OrderStatus[];
  onBulkStatusUpdate?: (status: OrderStatus, note?: string) => void;
  onExportCsv?: () => void;
  bulkUpdating?: boolean;
  bulkResult?: { succeeded: string[]; failed: Array<{ orderId: string; error: string }> } | null;
  onClearBulkResult?: () => void;
}

const COLUMNS = [
  { label: 'Order ID', className: 'text-left' },
  { label: 'Status', className: 'text-left' },
  { label: 'Customer', className: 'text-left' },
  { label: 'Fulfillment', className: 'text-left' },
  { label: 'Items', className: 'text-center' },
  { label: 'Total', className: 'text-right' },
  { label: 'Date', className: 'text-left' },
  { label: 'Age', className: 'text-center' },
  { label: 'Actions', className: 'text-left' },
];

const SKELETON_WIDTHS = ['65%', '50%', '80%', '55%', '40%', '60%', '70%', '45%', '70%'];

function SkeletonRow({ showCheckbox }: { showCheckbox: boolean }) {
  return (
    <tr className="border-b border-gray-100">
      {showCheckbox && (
        <td className="px-4 py-3 w-10">
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
        </td>
      )}
      {COLUMNS.map((col, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: SKELETON_WIDTHS[i] }} />
        </td>
      ))}
    </tr>
  );
}

export default function OrdersTable({
  orders,
  loading,
  pagination,
  onPageChange,
  onPageSizeChange,
  onOrderClick,
  onTransition,
  selectionEnabled = false,
  selectedIds,
  onToggleSelection,
  onSelectAll,
  onDeselectAll,
  commonTransitions = [],
  onBulkStatusUpdate,
  onExportCsv,
  bulkUpdating = false,
  bulkResult = null,
  onClearBulkResult,
}: OrdersTableProps) {
  const selectionCount = selectedIds?.size ?? 0;
  const allSelected = selectionEnabled && orders.length > 0 && orders.every((o) => selectedIds?.has(o.id));

  const handleSelectAllToggle = () => {
    if (allSelected) {
      onDeselectAll?.();
    } else {
      onSelectAll?.(orders.map((o) => o.id));
    }
  };

  return (
    <>
      {/* Bulk Action Bar */}
      {selectionEnabled && onBulkStatusUpdate && onExportCsv && onDeselectAll && onClearBulkResult && (
        <BulkActionBar
          selectionCount={selectionCount}
          commonTransitions={commonTransitions}
          onBulkStatusUpdate={onBulkStatusUpdate}
          onExportCsv={onExportCsv}
          onDeselectAll={onDeselectAll}
          updating={bulkUpdating}
          lastResult={bulkResult}
          onClearResult={onClearBulkResult}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {selectionEnabled && (
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAllToggle}
                      className="h-4 w-4 text-sage-600 border-gray-300 rounded focus:ring-sage-500"
                    />
                  </th>
                )}
                {COLUMNS.map((col) => (
                  <th
                    key={col.label}
                    className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.className}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && orders.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} showCheckbox={selectionEnabled} />
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length + (selectionEnabled ? 1 : 0)} className="px-4 py-12 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                      />
                    </svg>
                    <p className="mt-4 text-gray-500 text-sm">No orders found</p>
                  </td>
                </tr>
              ) : selectionEnabled && onToggleSelection ? (
                orders.map((order) => (
                  <SelectableOrderRow
                    key={order.id}
                    id={order.id}
                    status={order.status}
                    fulfillmentMethod={order.fulfillmentMethod}
                    customerName={order.customerName}
                    customerEmail={order.customerEmail}
                    itemCount={order.itemCount}
                    total={order.total}
                    trackingNumber={order.trackingNumber}
                    createdAt={order.createdAt}
                    selected={selectedIds?.has(order.id) ?? false}
                    onSelect={onToggleSelection}
                    onClick={onOrderClick}
                    onTransition={onTransition}
                  />
                ))
              ) : (
                orders.map((order) => (
                  <OrderRow
                    key={order.id}
                    id={order.id}
                    status={order.status}
                    fulfillmentMethod={order.fulfillmentMethod}
                    customerName={order.customerName}
                    customerEmail={order.customerEmail}
                    itemCount={order.itemCount}
                    total={order.total}
                    trackingNumber={order.trackingNumber}
                    createdAt={order.createdAt}
                    onClick={onOrderClick}
                    onTransition={onTransition}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalItems > 0 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        )}
      </div>
    </>
  );
}
