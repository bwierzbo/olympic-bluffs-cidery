'use client';

import { useCallback, useState } from 'react';
import { OrderStatus } from '@/lib/types';
import { getAllowedTransitions } from '@/lib/status-transitions';
import type { OrderSummary } from '@/lib/hooks/useAdminOrders';

interface BulkResult {
  succeeded: string[];
  failed: Array<{ orderId: string; error: string }>;
}

interface UseBulkActionsReturn {
  selectedIds: Set<string>;
  toggleSelection: (orderId: string) => void;
  selectAll: (orderIds: string[]) => void;
  deselectAll: () => void;
  isSelected: (orderId: string) => boolean;
  selectionCount: number;
  commonTransitions: OrderStatus[];
  bulkUpdateStatus: (status: OrderStatus, note?: string) => Promise<BulkResult | null>;
  updating: boolean;
  lastResult: BulkResult | null;
  clearResult: () => void;
}

/**
 * Compute the intersection of allowed transitions across all selected orders.
 */
function getCommonTransitions(
  selectedIds: Set<string>,
  orders: OrderSummary[],
): OrderStatus[] {
  const selectedOrders = orders.filter((o) => selectedIds.has(o.id));
  if (selectedOrders.length === 0) return [];

  // Start with transitions of the first selected order
  let common = new Set(
    getAllowedTransitions({
      status: selectedOrders[0].status,
      fulfillmentMethod: selectedOrders[0].fulfillmentMethod,
    }),
  );

  // Intersect with each subsequent order
  for (let i = 1; i < selectedOrders.length; i++) {
    const allowed = new Set(
      getAllowedTransitions({
        status: selectedOrders[i].status,
        fulfillmentMethod: selectedOrders[i].fulfillmentMethod,
      }),
    );
    common = new Set([...common].filter((s) => allowed.has(s)));
  }

  return Array.from(common);
}

export function useBulkActions(
  orders: OrderSummary[],
  callbacks?: {
    onSuccess?: () => void;
    onError?: (error: string) => void;
  },
): UseBulkActionsReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState(false);
  const [lastResult, setLastResult] = useState<BulkResult | null>(null);

  const toggleSelection = useCallback((orderId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((orderIds: string[]) => {
    setSelectedIds(new Set(orderIds));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (orderId: string) => selectedIds.has(orderId),
    [selectedIds],
  );

  const commonTransitions = getCommonTransitions(selectedIds, orders);

  const bulkUpdateStatus = useCallback(
    async (status: OrderStatus, note?: string): Promise<BulkResult | null> => {
      if (selectedIds.size === 0) return null;

      setUpdating(true);
      setLastResult(null);

      try {
        const res = await fetch('/api/admin/orders/bulk/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderIds: Array.from(selectedIds),
            status,
            note,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const errorMsg = body.detail || body.error || 'Bulk update failed';
          callbacks?.onError?.(errorMsg);
          return null;
        }

        const result: BulkResult = await res.json();
        setLastResult(result);

        if (result.succeeded.length > 0) {
          setSelectedIds(new Set());
          callbacks?.onSuccess?.();
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Bulk update failed';
        callbacks?.onError?.(errorMsg);
        return null;
      } finally {
        setUpdating(false);
      }
    },
    [selectedIds, callbacks],
  );

  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    deselectAll,
    isSelected,
    selectionCount: selectedIds.size,
    commonTransitions,
    bulkUpdateStatus,
    updating,
    lastResult,
    clearResult,
  };
}
