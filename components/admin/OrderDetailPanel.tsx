'use client';

import { useState } from 'react';
import { OrderStatus } from '@/lib/types';
import { useOrderDetail } from '@/lib/hooks/useOrderDetail';
import { useStatusUpdate } from '@/lib/hooks/useStatusUpdate';
import StatusBadge from './StatusBadge';
import OrderActions from './OrderActions';
import AuditTimeline from './AuditTimeline';
import TrackingInput from './TrackingInput';
import NoteInput from './NoteInput';
import StatusTransitionModal from './StatusTransitionModal';

interface OrderDetailPanelProps {
  orderId: string | null;
  onClose: () => void;
  onOrderUpdated: (orderId: string, newStatus?: OrderStatus) => void;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function OrderDetailPanel({ orderId, onClose, onOrderUpdated }: OrderDetailPanelProps) {
  const { order, auditLog, loading, error, refetch } = useOrderDetail(orderId);

  const [transitionTarget, setTransitionTarget] = useState<OrderStatus | null>(null);

  const { updating, updateStatus, addTracking, addNote } = useStatusUpdate({
    onSuccess: (id, newStatus) => {
      refetch();
      onOrderUpdated(id, newStatus);
    },
  });

  if (!orderId) return null;

  const handleTransition = (_orderId: string, toStatus: OrderStatus) => {
    setTransitionTarget(toStatus);
  };

  const handleConfirmTransition = async (data: { note?: string; trackingNumber?: string }) => {
    if (!order || !transitionTarget) return;

    const result = await updateStatus(order.id, transitionTarget, data.note);
    if (result.success) {
      // Add tracking if provided during a shipped transition
      if (data.trackingNumber && transitionTarget === 'shipped') {
        await addTracking(order.id, data.trackingNumber);
      }
      setTransitionTarget(null);
    }
  };

  const handleAddTracking = async (trackingNumber: string) => {
    if (!order) return;
    await addTracking(order.id, trackingNumber);
  };

  const handleAddNote = async (note: string) => {
    if (!order) return;
    await addNote(order.id, note);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Order Detail</h2>
            {order && <StatusBadge status={order.status} size="md" />}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {loading && !order && (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {order && (
            <>
              {/* Order ID + Actions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-medium text-gray-900">{order.id}</span>
                  <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                </div>
                <OrderActions
                  orderId={order.id}
                  status={order.status}
                  fulfillmentMethod={order.fulfillmentMethod}
                  onTransition={handleTransition}
                />
              </div>

              {/* Customer Info */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer</h3>
                <div className="bg-gray-50 rounded-md p-3 text-sm space-y-1">
                  <p className="font-medium text-gray-900">
                    {order.customerInfo.firstName} {order.customerInfo.lastName}
                  </p>
                  <p className="text-gray-600">{order.customerInfo.email}</p>
                  <p className="text-gray-600">{order.customerInfo.phone}</p>
                </div>
              </section>

              {/* Fulfillment */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Fulfillment</h3>
                <div className="bg-gray-50 rounded-md p-3 text-sm">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    order.fulfillmentMethod === 'pickup'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-blue-50 text-blue-700'
                  }`}>
                    {order.fulfillmentMethod === 'pickup' ? 'Pickup' : 'Shipping'}
                  </span>

                  {order.shippingAddress && (
                    <div className="mt-2 text-gray-600 space-y-0.5">
                      <p>{order.shippingAddress.fullName}</p>
                      <p>{order.shippingAddress.addressLine1}</p>
                      {order.shippingAddress.addressLine2 && (
                        <p>{order.shippingAddress.addressLine2}</p>
                      )}
                      <p>
                        {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                        {order.shippingAddress.postalCode}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Tracking (for shipping orders) */}
              {order.fulfillmentMethod === 'shipping' && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Tracking</h3>
                  <TrackingInput
                    currentTracking={order.trackingNumber}
                    onSubmit={handleAddTracking}
                    updating={updating}
                  />
                </section>
              )}

              {/* Items */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Items</h3>
                <div className="border border-gray-200 rounded-md divide-y divide-gray-100">
                  {order.items.map((item, i) => (
                    <div key={i} className="px-3 py-2 flex justify-between items-center text-sm">
                      <div>
                        <span className="text-gray-900">{item.name}</span>
                        {item.variation && (
                          <span className="text-gray-400 ml-1">({item.variation.name})</span>
                        )}
                        <span className="text-gray-400 ml-2">x{item.quantity}</span>
                      </div>
                      <span className="text-gray-700 font-medium">
                        {formatCents(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatCents(order.subtotal)}</span>
                  </div>
                  {order.shippingCost > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Shipping</span>
                      <span>{formatCents(order.shippingCost)}</span>
                    </div>
                  )}
                  {order.tax > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Tax</span>
                      <span>{formatCents(order.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1">
                    <span>Total</span>
                    <span>{formatCents(order.total)}</span>
                  </div>
                </div>
              </section>

              {/* Admin Notes */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
                {order.adminNotes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-2 text-sm text-gray-700">
                    {order.adminNotes}
                  </div>
                )}
                <NoteInput onSubmit={handleAddNote} updating={updating} />
              </section>

              {/* Audit Timeline */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Activity</h3>
                <AuditTimeline entries={auditLog} loading={loading} />
              </section>
            </>
          )}
        </div>
      </div>

      {/* Status Transition Modal */}
      {order && transitionTarget && (
        <StatusTransitionModal
          isOpen={true}
          onClose={() => setTransitionTarget(null)}
          onConfirm={handleConfirmTransition}
          orderId={order.id}
          fromStatus={order.status}
          toStatus={transitionTarget}
          fulfillmentMethod={order.fulfillmentMethod}
          updating={updating}
        />
      )}
    </>
  );
}
