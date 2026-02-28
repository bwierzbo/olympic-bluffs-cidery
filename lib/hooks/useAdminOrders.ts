'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { OrderStatus, FulfillmentMethod } from '@/lib/types';

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  total: number;
  trackingNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface OrdersFilters {
  tab?: 'active' | 'completed';
  status?: string;
  fulfillment?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface AdminOrdersResponse {
  data: OrderSummary[];
  pagination: Pagination;
  counts: Record<string, number>;
}

interface UseAdminOrdersReturn {
  orders: OrderSummary[];
  pagination: Pagination;
  counts: Record<string, number>;
  loading: boolean;
  error: string | null;
  authError: boolean;
  filters: OrdersFilters;
  setFilters: (filters: OrdersFilters) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refetch: () => void;
  updateOrderInList: (orderId: string, updates: Partial<OrderSummary>) => void;
}

const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  pageSize: 20,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

const FILTER_KEYS: (keyof OrdersFilters)[] = [
  'tab', 'status', 'fulfillment', 'search', 'dateFrom', 'dateTo', 'sortBy', 'sortOrder',
];

/** Read filters from the browser URL search params */
function filtersFromURL(): OrdersFilters {
  if (typeof window === 'undefined') return { tab: 'active' };

  const params = new URLSearchParams(window.location.search);
  const filters: OrdersFilters = {};

  for (const key of FILTER_KEYS) {
    const val = params.get(key);
    if (val) {
      (filters as Record<string, string>)[key] = val;
    }
  }

  if (!filters.tab) filters.tab = 'active';
  return filters;
}

/** Read page number from URL */
function pageFromURL(): number {
  if (typeof window === 'undefined') return 1;
  const val = new URLSearchParams(window.location.search).get('page');
  return val ? Math.max(1, parseInt(val, 10) || 1) : 1;
}

/** Push filters + page into the URL without triggering a navigation */
function pushFiltersToURL(filters: OrdersFilters, page: number) {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const val = (filters as Record<string, string | undefined>)[key];
    if (val && !(key === 'tab' && val === 'active')) {
      params.set(key, val);
    }
  }
  if (page > 1) params.set('page', String(page));

  const qs = params.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;

  // Use pushState so browser back/forward works
  window.history.pushState(null, '', url);
}

export function useAdminOrders(initialFilters?: OrdersFilters): UseAdminOrdersReturn {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [filters, setFiltersState] = useState<OrdersFilters>(() => {
    // On mount, read from URL if available; fall back to initialFilters
    const fromUrl = filtersFromURL();
    const hasUrlFilters = FILTER_KEYS.some(
      (k) => (fromUrl as Record<string, string | undefined>)[k] && k !== 'tab'
    );
    return hasUrlFilters ? fromUrl : (initialFilters ?? fromUrl);
  });
  const [page, setPageState] = useState(() => pageFromURL());
  const [pageSize, setPageSizeState] = useState(20);

  // Track whether we're handling a popstate to avoid double-pushing to URL
  const isPopstateRef = useRef(false);

  // Listen for browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      isPopstateRef.current = true;
      setFiltersState(filtersFromURL());
      setPageState(pageFromURL());
      // Reset after a tick
      setTimeout(() => { isPopstateRef.current = false; }, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthError(false);

    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));

    if (filters.tab) params.set('tab', filters.tab);
    if (filters.status) params.set('status', filters.status);
    if (filters.fulfillment) params.set('fulfillment', filters.fulfillment);
    if (filters.search) params.set('search', filters.search);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

    try {
      const res = await fetch(`/api/admin/orders?${params.toString()}`);

      if (res.status === 401) {
        setAuthError(true);
        setOrders([]);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || body.error || 'Failed to fetch orders');
      }

      const data: AdminOrdersResponse = await res.json();
      setOrders(data.data);
      setPagination(data.pagination);
      setCounts(data.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Sync filter state to URL (skip if this change came from popstate)
  useEffect(() => {
    if (!isPopstateRef.current) {
      pushFiltersToURL(filters, page);
    }
  }, [filters, page]);

  const setFilters = useCallback((newFilters: OrdersFilters) => {
    setFiltersState(newFilters);
    setPageState(1); // reset to page 1 when filters change
  }, []);

  const setPage = useCallback((p: number) => {
    setPageState(p);
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPageState(1);
  }, []);

  /** Optimistically update a single order in the current list without a full refetch. */
  const updateOrderInList = useCallback((orderId: string, updates: Partial<OrderSummary>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o))
    );
  }, []);

  return {
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
    refetch: fetchOrders,
    updateOrderInList,
  };
}
