'use client';

import { OrderStatus } from '@/lib/types';
import type { OrderSummary, OrdersFilters } from '@/lib/hooks/useAdminOrders';
import StatusCounters from './StatusCounters';
import FilterBar from './FilterBar';
import OrdersTable from './OrdersTable';

interface ListViewProps {
  orders: OrderSummary[];
  loading: boolean;
  error: string | null;
  filters: OrdersFilters;
  counts: Record<string, number>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  onFiltersChange: (filters: OrdersFilters) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onOrderClick: (orderId: string) => void;
  onTransition: (orderId: string, toStatus: OrderStatus) => void;
  // Bulk selection
  selectedIds: Set<string>;
  onToggleSelection: (orderId: string) => void;
  onSelectAll: (orderIds: string[]) => void;
  onDeselectAll: () => void;
  commonTransitions: OrderStatus[];
  onBulkStatusUpdate: (status: OrderStatus, note?: string) => void;
  onExportCsv: () => void;
  bulkUpdating: boolean;
  bulkResult: { succeeded: string[]; failed: Array<{ orderId: string; error: string }> } | null;
  onClearBulkResult: () => void;
}

export default function ListView({
  orders,
  loading,
  error,
  filters,
  counts,
  pagination,
  onFiltersChange,
  onPageChange,
  onPageSizeChange,
  onOrderClick,
  onTransition,
  selectedIds,
  onToggleSelection,
  onSelectAll,
  onDeselectAll,
  commonTransitions,
  onBulkStatusUpdate,
  onExportCsv,
  bulkUpdating,
  bulkResult,
  onClearBulkResult,
}: ListViewProps) {
  const activeStatusFilter = filters.tab === 'active' ? filters.status : undefined;

  const handleStatusCounterClick = (status: string | undefined) => {
    if (status) {
      onFiltersChange({ ...filters, tab: 'active', status });
    } else {
      onFiltersChange({ ...filters, tab: 'active', status: undefined });
    }
  };

  const handleTabChange = (tab: 'active' | 'completed') => {
    onFiltersChange({ tab });
  };

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Tab navigation */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => handleTabChange('active')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              filters.tab === 'active'
                ? 'border-sage-500 text-sage-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Active Orders
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filters.tab === 'active' ? 'bg-sage-100 text-sage-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {Object.entries(counts)
                .filter(([s]) => !['completed', 'cancelled'].includes(s))
                .reduce((sum, [, c]) => sum + c, 0)}
            </span>
          </button>
          <button
            onClick={() => handleTabChange('completed')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              filters.tab === 'completed'
                ? 'border-sage-500 text-sage-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Completed
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filters.tab === 'completed' ? 'bg-sage-100 text-sage-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {(counts['completed'] || 0) + (counts['cancelled'] || 0)}
            </span>
          </button>
        </nav>
      </div>

      {/* Status counters (only on active tab) */}
      {filters.tab === 'active' && (
        <StatusCounters
          counts={counts}
          activeStatus={activeStatusFilter}
          onStatusClick={handleStatusCounterClick}
        />
      )}

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onFiltersChange={onFiltersChange}
      />

      {/* Orders table */}
      <OrdersTable
        orders={orders}
        loading={loading}
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onOrderClick={onOrderClick}
        onTransition={onTransition}
        selectionEnabled={true}
        selectedIds={selectedIds}
        onToggleSelection={onToggleSelection}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
        commonTransitions={commonTransitions}
        onBulkStatusUpdate={onBulkStatusUpdate}
        onExportCsv={onExportCsv}
        bulkUpdating={bulkUpdating}
        bulkResult={bulkResult}
        onClearBulkResult={onClearBulkResult}
      />
    </>
  );
}
