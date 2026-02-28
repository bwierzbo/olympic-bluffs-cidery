'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Order, OrderStatus } from '@/lib/types';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        const data = await response.json();

        if (response.ok && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || 'Order not found');
        }
      } catch (err) {
        setError('Failed to load order');
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const getStatusInfo = (status: OrderStatus) => {
    const statusMap: Record<OrderStatus, { label: string; color: string; icon: string }> = {
      confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800', icon: '✓' },
      processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: '📦' },
      ready: { label: 'Ready for Pickup', color: 'bg-purple-100 text-purple-800', icon: '🎉' },
      shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800', icon: '🚚' },
      on_hold: { label: 'On Hold', color: 'bg-orange-100 text-orange-800', icon: '⏸' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: '✅' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: '✕' },
    };

    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: '?' };
  };

  const getProgressSteps = () => {
    if (!order) return [];

    const baseSteps = [
      { status: 'confirmed', label: 'Order Confirmed' },
      { status: 'processing', label: 'Processing' },
    ];

    if (order.fulfillmentMethod === 'pickup') {
      baseSteps.push(
        { status: 'ready', label: 'Ready for Pickup' },
        { status: 'completed', label: 'Picked Up' }
      );
    } else {
      baseSteps.push(
        { status: 'shipped', label: 'Shipped' },
        { status: 'completed', label: 'Delivered' }
      );
    }

    return baseSteps;
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const steps = getProgressSteps();
    const currentIndex = steps.findIndex(step => step.status === order.status);
    return currentIndex >= 0 ? currentIndex : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-sage-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-3xl px-4">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
              <svg
                className="h-10 w-10 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/shop/lavender"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sage-500 hover:bg-sage-600"
            >
              Return to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const progressSteps = getProgressSteps();
  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sage-600 hover:text-sage-700 font-medium flex items-center gap-2 mb-4"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Order Tracking</h1>
        </div>

        {/* Order Number & Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="text-xl font-mono font-semibold text-gray-900">{order.id}</p>
              <p className="text-sm text-gray-500 mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${statusInfo.color}`}>
                <span>{statusInfo.icon}</span>
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Progress</h2>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div
              className="absolute left-6 top-0 w-0.5 bg-sage-500 transition-all duration-500"
              style={{ height: `${(currentStepIndex / (progressSteps.length - 1)) * 100}%` }}
            />

            {/* Steps */}
            <div className="relative space-y-8">
              {progressSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div key={step.status} className="flex items-start gap-4">
                    <div
                      className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                        isCompleted
                          ? 'bg-sage-500 border-sage-500'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {isCompleted && (
                        <svg
                          className="h-6 w-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="3"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 pt-2">
                      <p className={`font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                        {step.label}
                      </p>
                      {isCurrent && order.statusHistory[currentStepIndex] && (
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(order.statusHistory[currentStepIndex].timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {order.statusHistory[currentStepIndex].note && (
                            <span className="block text-gray-500">
                              {order.statusHistory[currentStepIndex].note}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>

          {/* Items */}
          <div className="divide-y divide-gray-200">
            {order.items.map((item, index) => (
              <div key={index} className="py-4 flex justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  {item.variation && (
                    <p className="text-sm text-gray-600">{item.variation.name}</p>
                  )}
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-gray-900">
                  ${((item.price * item.quantity) / 100).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">${(order.subtotal / 100).toFixed(2)}</span>
            </div>
            {order.shippingCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-900">${(order.shippingCost / 100).toFixed(2)}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-900">${(order.tax / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">${(order.total / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Fulfillment Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {order.fulfillmentMethod === 'pickup' ? 'Pickup Information' : 'Shipping Information'}
          </h2>

          {order.fulfillmentMethod === 'pickup' ? (
            <div className="space-y-3">
              <p className="text-gray-700">
                <strong>Location:</strong> Olympic Bluffs Cidery & Lavender Farm
              </p>
              <p className="text-sm text-gray-600">
                We'll notify you at <strong>{order.customerInfo.email}</strong> when your order is ready for pickup.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {order.shippingAddress && (
                <div className="text-gray-700">
                  <p className="font-semibold">{order.shippingAddress.fullName}</p>
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-600">
                Tracking information will be sent to <strong>{order.customerInfo.email}</strong> once your order ships.
              </p>
            </div>
          )}
        </div>

        {/* Support */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Questions about your order?{' '}
            <Link href="/contact" className="text-sage-600 hover:text-sage-700 font-medium">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
