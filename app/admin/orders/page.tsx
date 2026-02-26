'use client';

import { useEffect, useState, useMemo } from 'react';
import { Order, OrderStatus } from '@/lib/types';
import Link from 'next/link';

// Status categories
const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'ready', 'shipped'];
const COMPLETED_STATUSES: OrderStatus[] = ['completed', 'cancelled'];


// Modal Component
function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

// Alert Modal
function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'error';
}) {
  const colors = {
    info: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
  };

  const icons = {
    info: 'ℹ️',
    success: '✓',
    error: '✕',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className={`rounded-lg p-4 mb-4 ${colors[type]}`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icons[type]}</span>
          <p>{message}</p>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-sage-600 text-white rounded-md hover:bg-sage-700"
        >
          OK
        </button>
      </div>
    </Modal>
  );
}

// Confirm Modal
function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'sage',
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'sage' | 'red';
}) {
  const buttonColors = {
    sage: 'bg-sage-600 hover:bg-sage-700',
    red: 'bg-red-600 hover:bg-red-700',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-gray-700 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          {cancelText}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 text-white rounded-md ${buttonColors[confirmColor]}`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

// Prompt Modal
function PromptModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  placeholder,
  confirmText = 'Submit',
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  message: string;
  placeholder?: string;
  confirmText?: string;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = () => {
    onConfirm(inputValue);
    setInputValue('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-gray-700 mb-4">{message}</p>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 mb-6"
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
        }}
        autoFocus
      />
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-sage-600 text-white rounded-md hover:bg-sage-700"
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

export default function AdminOrdersPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Filter states
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered orders with counts
  const { filteredOrders, activeCount, completedCount } = useMemo(() => {
    const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status));
    const completedOrders = orders.filter(o => COMPLETED_STATUSES.includes(o.status));

    const tabOrders = activeTab === 'active' ? activeOrders : completedOrders;

    const searchFiltered = tabOrders.filter(order => {
      if (!searchTerm.trim()) return true;
      const search = searchTerm.toLowerCase();
      return (
        order.id.toLowerCase().includes(search) ||
        order.customerInfo.firstName.toLowerCase().includes(search) ||
        order.customerInfo.lastName.toLowerCase().includes(search) ||
        order.customerInfo.email.toLowerCase().includes(search) ||
        order.customerInfo.phone.includes(search)
      );
    });

    return {
      filteredOrders: searchFiltered,
      activeCount: activeOrders.length,
      completedCount: completedOrders.length,
    };
  }, [orders, activeTab, searchTerm]);

  // Modal states
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'success' | 'error';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmColor?: 'sage' | 'red';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    placeholder: string;
    onConfirm: (value: string) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    placeholder: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    // Check if already authenticated in session
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchOrders();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_auth', 'true');
        fetchOrders();
      } else {
        setAlertModal({
          isOpen: true,
          title: 'Login Failed',
          message: 'Incorrect password. Please try again.',
          type: 'error',
        });
      }
    } catch {
      setAlertModal({
        isOpen: true,
        title: 'Login Failed',
        message: 'Unable to verify password. Please try again.',
        type: 'error',
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_auth');
    setPassword('');
    setOrders([]);
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders || []);
      } else {
        setError(data.error || 'Failed to load orders');
      }
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    trackingNumber?: string
  ) => {
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: trackingNumber ? `Tracking: ${trackingNumber}` : undefined,
          trackingNumber,
        }),
      });

      if (response.ok) {
        // Refresh orders list
        await fetchOrders();
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: `Order ${orderId} updated to ${newStatus}. Customer email sent.`,
          type: 'success',
        });
      } else {
        const data = await response.json();
        setAlertModal({
          isOpen: true,
          title: 'Error',
          message: `Failed to update order: ${data.error}`,
          type: 'error',
        });
      }
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update order status',
        type: 'error',
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      confirmed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      ready: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.pending;
  };

  const getNextActions = (order: Order): Array<{ status: OrderStatus; label: string; prompt?: boolean }> => {
    const actions: Array<{ status: OrderStatus; label: string; prompt?: boolean }> = [];

    if (order.status === 'confirmed') {
      actions.push({ status: 'processing', label: '→ Processing' });
    }

    if (order.status === 'processing') {
      if (order.fulfillmentMethod === 'pickup') {
        actions.push({ status: 'ready', label: '→ Ready for Pickup' });
      } else {
        actions.push({ status: 'shipped', label: '→ Mark as Shipped', prompt: true });
      }
    }

    if (order.status === 'ready' || order.status === 'shipped') {
      actions.push({ status: 'completed', label: '→ Complete' });
    }

    // Always allow cancellation for non-completed orders
    if (order.status !== 'completed' && order.status !== 'cancelled') {
      actions.push({ status: 'cancelled', label: '✕ Cancel' });
    }

    return actions;
  };

  const handleActionClick = (order: Order, action: { status: OrderStatus; label: string; prompt?: boolean }) => {
    if (action.prompt && action.status === 'shipped') {
      setPromptModal({
        isOpen: true,
        title: 'Mark as Shipped',
        message: 'Enter tracking number (optional):',
        placeholder: 'e.g., 1Z999AA10123456784',
        onConfirm: (trackingNumber) => {
          updateOrderStatus(order.id, action.status, trackingNumber || undefined);
        },
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: action.status === 'cancelled' ? 'Cancel Order' : 'Update Order Status',
        message: action.status === 'cancelled'
          ? `Are you sure you want to cancel order ${order.id}?`
          : `Update order ${order.id} to ${action.status}?`,
        confirmColor: action.status === 'cancelled' ? 'red' : 'sage',
        onConfirm: () => {
          updateOrderStatus(order.id, action.status);
        },
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Admin Login
          </h1>
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
              className="w-full bg-sage-600 text-white py-2 px-4 rounded-md hover:bg-sage-700 font-medium"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600 mt-1">Manage and track all orders</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="px-4 py-2 bg-sage-600 text-white rounded-md hover:bg-sage-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Back to Site
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by order ID, name, email, or phone..."
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab('active')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'active'
                  ? 'border-sage-500 text-sage-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Active Orders
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'active' ? 'bg-sage-100 text-sage-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {activeCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'completed'
                  ? 'border-sage-500 text-sage-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Completed
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'completed' ? 'bg-sage-100 text-sage-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {completedCount}
              </span>
            </button>
          </nav>
        </div>

        {/* Orders List */}
        {loading && orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-sage-500 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600 text-lg">No orders yet</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <p className="text-gray-600 text-lg mt-4">
              {searchTerm
                ? `No ${activeTab === 'active' ? 'active' : 'completed'} orders match "${searchTerm}"`
                : `No ${activeTab === 'active' ? 'active' : 'completed'} orders`}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-sage-600 hover:text-sage-700 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-mono font-bold text-lg">{order.id}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                            {order.status.toUpperCase()}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            order.fulfillmentMethod === 'pickup' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {order.fulfillmentMethod === 'pickup' ? '📦 PICKUP' : '🚚 SHIPPING'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Customer</p>
                        <p className="text-sm text-gray-900">{order.customerInfo.firstName} {order.customerInfo.lastName}</p>
                        <p className="text-sm text-gray-600">{order.customerInfo.email}</p>
                        <p className="text-sm text-gray-600">{order.customerInfo.phone}</p>
                      </div>

                      {order.fulfillmentMethod === 'shipping' && order.shippingAddress && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Shipping Address</p>
                          <p className="text-sm text-gray-900">{order.shippingAddress.fullName}</p>
                          <p className="text-sm text-gray-600">{order.shippingAddress.addressLine1}</p>
                          {order.shippingAddress.addressLine2 && (
                            <p className="text-sm text-gray-600">{order.shippingAddress.addressLine2}</p>
                          )}
                          <p className="text-sm text-gray-600">
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Items */}
                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Items</p>
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-900">
                              {item.name} {item.variation ? `(${item.variation.name})` : ''} × {item.quantity}
                            </span>
                            <span className="font-medium">${((item.price * item.quantity) / 100).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-sm font-bold">
                        <span>Total</span>
                        <span>${(order.total / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="lg:w-64 flex flex-col gap-2">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Actions</p>
                    {getNextActions(order).map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleActionClick(order, action)}
                        disabled={updatingOrderId === order.id}
                        className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                          action.status === 'cancelled'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-sage-100 text-sage-700 hover:bg-sage-200'
                        } disabled:opacity-50`}
                      >
                        {updatingOrderId === order.id ? 'Updating...' : action.label}
                      </button>
                    ))}
                    <Link
                      href={`/orders/${order.id}`}
                      target="_blank"
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-center font-medium text-sm"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmColor={confirmModal.confirmColor}
      />

      <PromptModal
        isOpen={promptModal.isOpen}
        onClose={() => setPromptModal({ ...promptModal, isOpen: false })}
        onConfirm={promptModal.onConfirm}
        title={promptModal.title}
        message={promptModal.message}
        placeholder={promptModal.placeholder}
      />
    </div>
  );
}
