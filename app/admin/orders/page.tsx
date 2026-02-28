'use client';

import { useState } from 'react';
import { OrderStatus } from '@/lib/types';
import { useAdminOrders } from '@/lib/hooks/useAdminOrders';
import { useBulkActions } from '@/lib/hooks/useBulkActions';
import AdminHeader from '@/components/admin/AdminHeader';
import StatusCounters from '@/components/admin/StatusCounters';
import FilterBar from '@/components/admin/FilterBar';
import OrdersTable from '@/components/admin/OrdersTable';
import OrderDetailPanel from '@/components/admin/OrderDetailPanel';
import StatusTransitionModal from '@/components/admin/StatusTransitionModal';
import { useStatusUpdate } from '@/lib/hooks/useStatusUpdate';

export default function AdminOrdersPage() {
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [inlineTransition, setInlineTransition] = useState<{
    orderId: string;
    fromStatus: OrderStatus;
    toStatus: OrderStatus;
    fulfillmentMethod: string;
  } | null>(null);

  const {
    orders,
    pagination,
    counts,
    loading,
    error,
    authError,
    filters,
    setFilters,
    setPage,
    setPageSize,
    refetch,
    updateOrderInList,
  } = useAdminOrders({ tab: 'active' });

  const { updating: inlineUpdating, updateStatus: inlineUpdateStatus, addTracking: inlineAddTracking } = useStatusUpdate({
    onSuccess: (orderId, newStatus) => {
      if (newStatus) {
        updateOrderInList(orderId, { status: newStatus });
      }
      refetch();
    },
  });

  const {
    selectedIds,
    toggleSelection,
    selectAll,
    deselectAll,
    commonTransitions,
    bulkUpdateStatus,
    updating: bulkUpdating,
    lastResult: bulkResult,
    clearResult: clearBulkResult,
  } = useBulkActions(orders, {
    onSuccess: () => refetch(),
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setPassword('');
        refetch();
      } else {
        setLoginError('Incorrect password. Please try again.');
      }
    } catch {
      setLoginError('Unable to verify password. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  // Show login if auth error (cookie missing or expired)
  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Admin Login
          </h1>
          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm">
              {loginError}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                placeholder="Enter admin password"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-sage-600 text-white py-2 px-4 rounded-md hover:bg-sage-700 font-medium disabled:opacity-50"
            >
              {loggingIn ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Active status filter from counters
  const activeStatusFilter = filters.tab === 'active' ? filters.status : undefined;

  const handleStatusCounterClick = (status: string | undefined) => {
    if (status) {
      setFilters({ ...filters, tab: 'active', status });
    } else {
      setFilters({ ...filters, tab: 'active', status: undefined });
    }
  };

  const handleOrderClick = (orderId: string) => {
    setSelectedOrderId(orderId);
  };

  const handleInlineTransition = (orderId: string, toStatus: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setInlineTransition({
      orderId,
      fromStatus: order.status,
      toStatus,
      fulfillmentMethod: order.fulfillmentMethod,
    });
  };

  const handleInlineConfirm = async (data: { note?: string; trackingNumber?: string }) => {
    if (!inlineTransition) return;
    const result = await inlineUpdateStatus(inlineTransition.orderId, inlineTransition.toStatus, data.note);
    if (result.success) {
      if (data.trackingNumber && inlineTransition.toStatus === 'shipped') {
        await inlineAddTracking(inlineTransition.orderId, data.trackingNumber);
      }
      setInlineTransition(null);
    }
  };

  const handleOrderUpdated = (orderId: string, newStatus?: OrderStatus) => {
    if (newStatus) {
      updateOrderInList(orderId, { status: newStatus });
    }
    refetch();
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (filters.tab) params.set('tab', filters.tab);
    if (filters.status) params.set('status', filters.status);
    if (filters.fulfillment) params.set('fulfillment', filters.fulfillment);
    if (filters.search) params.set('search', filters.search);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
    const qs = params.toString();
    window.open(`/api/admin/orders/export${qs ? `?${qs}` : ''}`, '_blank');
  };

  const handleBulkStatusUpdate = (status: OrderStatus, note?: string) => {
    bulkUpdateStatus(status, note);
  };

  const handleTabChange = (tab: 'active' | 'completed') => {
    // Tab switch clears all other filters
    setFilters({ tab });
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminHeader loading={loading} onRefresh={refetch} />

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
          onFiltersChange={setFilters}
        />

        {/* Orders table */}
        <OrdersTable
          orders={orders}
          loading={loading}
          pagination={pagination}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onOrderClick={handleOrderClick}
          onTransition={handleInlineTransition}
          selectionEnabled={true}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          commonTransitions={commonTransitions}
          onBulkStatusUpdate={handleBulkStatusUpdate}
          onExportCsv={handleExportCsv}
          bulkUpdating={bulkUpdating}
          bulkResult={bulkResult}
          onClearBulkResult={clearBulkResult}
        />
      </div>

      {/* Order Detail Panel */}
      {selectedOrderId && (
        <OrderDetailPanel
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onOrderUpdated={handleOrderUpdated}
        />
      )}

      {/* Inline Status Transition Modal */}
      {inlineTransition && (
        <StatusTransitionModal
          isOpen={true}
          onClose={() => setInlineTransition(null)}
          onConfirm={handleInlineConfirm}
          orderId={inlineTransition.orderId}
          fromStatus={inlineTransition.fromStatus}
          toStatus={inlineTransition.toStatus}
          fulfillmentMethod={inlineTransition.fulfillmentMethod}
          updating={inlineUpdating}
        />
      )}
    </div>
  );
}
