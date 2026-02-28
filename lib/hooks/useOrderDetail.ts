'use client';

import { useCallback, useEffect, useState } from 'react';
import { Order, OrderAuditEntry, OrderStatus, FulfillmentMethod } from '@/lib/types';

export interface OrderDetail {
  id: string;
  items: Order['items'];
  customerInfo: Order['customerInfo'];
  fulfillmentMethod: FulfillmentMethod;
  shippingAddress?: Order['shippingAddress'];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  paymentId: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  trackingNumber: string | null;
  adminNotes: string | null;
}

interface OrderDetailResponse {
  order: OrderDetail;
  auditLog: OrderAuditEntry[];
}

interface UseOrderDetailReturn {
  order: OrderDetail | null;
  auditLog: OrderAuditEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useOrderDetail(orderId: string | null): UseOrderDetailReturn {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [auditLog, setAuditLog] = useState<OrderAuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!orderId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || body.error || 'Failed to fetch order');
      }

      const data: OrderDetailResponse = await res.json();
      setOrder(data.order);
      setAuditLog(data.auditLog);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      fetchDetail();
    } else {
      setOrder(null);
      setAuditLog([]);
    }
  }, [orderId, fetchDetail]);

  return { order, auditLog, loading, error, refetch: fetchDetail };
}
