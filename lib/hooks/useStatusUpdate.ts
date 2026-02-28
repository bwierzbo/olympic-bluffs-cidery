'use client';

import { useCallback, useState } from 'react';
import { OrderStatus } from '@/lib/types';

interface StatusUpdateResult {
  success: boolean;
  error?: string;
}

interface UseStatusUpdateReturn {
  updating: boolean;
  updateStatus: (
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
  ) => Promise<StatusUpdateResult>;
  addTracking: (orderId: string, trackingNumber: string) => Promise<StatusUpdateResult>;
  addNote: (orderId: string, note: string) => Promise<StatusUpdateResult>;
}

export function useStatusUpdate(callbacks?: {
  onSuccess?: (orderId: string, newStatus?: OrderStatus) => void;
  onError?: (orderId: string, error: string) => void;
}): UseStatusUpdateReturn {
  const [updating, setUpdating] = useState(false);

  const updateStatus = useCallback(
    async (
      orderId: string,
      newStatus: OrderStatus,
      note?: string,
    ): Promise<StatusUpdateResult> => {
      setUpdating(true);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, note }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const errorMsg = body.detail || body.error || 'Failed to update status';
          callbacks?.onError?.(orderId, errorMsg);
          return { success: false, error: errorMsg };
        }

        callbacks?.onSuccess?.(orderId, newStatus);
        return { success: true };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update status';
        callbacks?.onError?.(orderId, errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setUpdating(false);
      }
    },
    [callbacks],
  );

  const addTracking = useCallback(
    async (orderId: string, trackingNumber: string): Promise<StatusUpdateResult> => {
      setUpdating(true);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/tracking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackingNumber }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const errorMsg = body.detail || body.error || 'Failed to update tracking';
          callbacks?.onError?.(orderId, errorMsg);
          return { success: false, error: errorMsg };
        }

        callbacks?.onSuccess?.(orderId);
        return { success: true };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update tracking';
        callbacks?.onError?.(orderId, errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setUpdating(false);
      }
    },
    [callbacks],
  );

  const addNote = useCallback(
    async (orderId: string, note: string): Promise<StatusUpdateResult> => {
      setUpdating(true);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const errorMsg = body.detail || body.error || 'Failed to add note';
          callbacks?.onError?.(orderId, errorMsg);
          return { success: false, error: errorMsg };
        }

        callbacks?.onSuccess?.(orderId);
        return { success: true };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to add note';
        callbacks?.onError?.(orderId, errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setUpdating(false);
      }
    },
    [callbacks],
  );

  return { updating, updateStatus, addTracking, addNote };
}
