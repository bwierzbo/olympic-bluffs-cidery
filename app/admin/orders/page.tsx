'use client';

import { useState, useEffect, useCallback } from 'react';
import { OrderStatus } from '@/lib/types';
import { useAdminOrders } from '@/lib/hooks/useAdminOrders';
import { useBulkActions } from '@/lib/hooks/useBulkActions';
import { useStatusUpdate } from '@/lib/hooks/useStatusUpdate';
import DashboardHeader from '@/components/admin/DashboardHeader';
import TestEmailPanel from '@/components/admin/TestEmailPanel';
import BoardView from '@/components/admin/BoardView';
import ListView from '@/components/admin/ListView';
import OrderDetailPanel from '@/components/admin/OrderDetailPanel';
import StatusTransitionModal from '@/components/admin/StatusTransitionModal';

type ViewMode = 'board' | 'list';

function getInitialViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'board';
  return (localStorage.getItem('admin-view-mode') as ViewMode) || 'board';
}

export default function AdminOrdersPage() {
  // Auth state
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [inlineTransition, setInlineTransition] = useState<{
    orderId: string;
    fromStatus: OrderStatus;
    toStatus: OrderStatus;
    fulfillmentMethod: string;
  } | null>(null);

  // Data fetching — board view uses large page size, list view uses default
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

  // Bump page size for board view to get all active orders in one request
  useEffect(() => {
    if (viewMode === 'board') {
      setPageSize(100);
    } else {
      setPageSize(20);
    }
  }, [viewMode, setPageSize]);

  // Persist view mode
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('admin-view-mode', mode);
    // Reset filters when switching views
    if (mode === 'board') {
      setFilters({ tab: 'active' });
      setSearchQuery('');
    } else {
      setFilters({ tab: 'active' });
    }
  }, [setFilters]);

  // Status updates (shared between board and list)
  const { updating: statusUpdating, updateStatus, addTracking } = useStatusUpdate({
    onSuccess: (orderId, newStatus) => {
      if (newStatus) {
        updateOrderInList(orderId, { status: newStatus });
      }
      refetch();
    },
  });

  // Bulk actions (list view only)
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

  // --- Handlers ---

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

  // Quick transition: one-click, no modal
  const handleQuickTransition = async (orderId: string, toStatus: OrderStatus) => {
    await updateStatus(orderId, toStatus);
  };

  // Transition that needs a modal (hold, cancel, shipped with tracking)
  const handleTransitionWithModal = (
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    fulfillmentMethod: string
  ) => {
    setInlineTransition({ orderId, fromStatus, toStatus, fulfillmentMethod });
  };

  // Modal confirm
  const handleModalConfirm = async (data: { note?: string; trackingNumber?: string }) => {
    if (!inlineTransition) return;
    const result = await updateStatus(inlineTransition.orderId, inlineTransition.toStatus, data.note);
    if (result.success) {
      if (data.trackingNumber && inlineTransition.toStatus === 'shipped') {
        await addTracking(inlineTransition.orderId, data.trackingNumber);
      }
      setInlineTransition(null);
    }
  };

  // Inline transition from list view (same modal flow)
  const handleListTransition = (orderId: string, toStatus: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setInlineTransition({
      orderId,
      fromStatus: order.status,
      toStatus,
      fulfillmentMethod: order.fulfillmentMethod,
    });
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

  // Search: in board mode filters client-side, in list mode updates hook filter
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (viewMode === 'list') {
      setFilters({ ...filters, search: query || undefined });
    }
  };

  // "Attention" count: new orders + on hold
  const attentionCount = (counts['confirmed'] || 0) + (counts['on_hold'] || 0);

  // --- Login screen ---
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

  // --- Main dashboard ---
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DashboardHeader
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          attentionCount={attentionCount}
          loading={loading}
          onRefresh={refetch}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />

        <TestEmailPanel />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}

        {viewMode === 'board' ? (
          <BoardView
            orders={orders}
            counts={counts}
            loading={loading}
            searchQuery={searchQuery}
            onOrderClick={setSelectedOrderId}
            onQuickTransition={handleQuickTransition}
            onTransitionWithModal={handleTransitionWithModal}
          />
        ) : (
          <ListView
            orders={orders}
            loading={loading}
            error={error}
            filters={filters}
            counts={counts}
            pagination={pagination}
            onFiltersChange={setFilters}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onOrderClick={setSelectedOrderId}
            onTransition={handleListTransition}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            commonTransitions={commonTransitions}
            onBulkStatusUpdate={(status, note) => bulkUpdateStatus(status, note)}
            onExportCsv={handleExportCsv}
            bulkUpdating={bulkUpdating}
            bulkResult={bulkResult}
            onClearBulkResult={clearBulkResult}
          />
        )}
      </div>

      {/* Order Detail Panel */}
      {selectedOrderId && (
        <OrderDetailPanel
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onOrderUpdated={handleOrderUpdated}
        />
      )}

      {/* Status Transition Modal */}
      {inlineTransition && (
        <StatusTransitionModal
          isOpen={true}
          onClose={() => setInlineTransition(null)}
          onConfirm={handleModalConfirm}
          orderId={inlineTransition.orderId}
          fromStatus={inlineTransition.fromStatus}
          toStatus={inlineTransition.toStatus}
          fulfillmentMethod={inlineTransition.fulfillmentMethod}
          updating={statusUpdating}
        />
      )}
    </div>
  );
}
