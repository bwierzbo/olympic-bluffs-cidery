'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/shop/CartProvider';
import OrderSummary from '@/components/shop/OrderSummary';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Customer Info
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Fulfillment
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'pickup' | 'shipping'>('pickup');

  // Shipping Address
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');


  // Square Payment
  const [card, setCard] = useState<any>(null);
  const [payments, setPayments] = useState<any>(null);
  const cardInstanceRef = useRef<any>(null);
  const isInitializingRef = useRef(false);
  const isProcessingPayment = useRef(false);

  const shippingCost = fulfillmentMethod === 'shipping' ? 1000 : 0; // $10 shipping
  const total = totalAmount + shippingCost;

  // Redirect if cart is empty (but not during payment processing)
  useEffect(() => {
    if (items.length === 0 && !isProcessingPayment.current) {
      router.push('/products');
    }
  }, [items, router]);

  // Initialize Square Web Payments SDK
  useEffect(() => {
    // Don't initialize if cart is empty
    if (items.length === 0) {
      return;
    }

    // Prevent duplicate initialization
    if (isInitializingRef.current) {
      return;
    }

    const initSquare = async () => {
      if (!window.Square) {
        console.error('Square.js failed to load');
        setError('Payment system failed to load. Please refresh the page.');
        return;
      }

      // Prevent duplicate initialization
      if (isInitializingRef.current) {
        return;
      }
      isInitializingRef.current = true;

      try {
        // Check if the card container element exists
        const container = document.getElementById('card-container');
        if (!container) {
          console.error('Card container not found, retrying...');
          isInitializingRef.current = false;
          // Retry after a short delay to ensure DOM is ready
          setTimeout(() => {
            isInitializingRef.current = false;
            initSquare();
          }, 100);
          return;
        }

        // Check if card is already initialized
        if (cardInstanceRef.current) {
          console.log('Card already initialized, skipping...');
          return;
        }

        const paymentsInstance = window.Square.payments(
          process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!,
          process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!
        );
        setPayments(paymentsInstance);

        // Clear the container before attaching
        container.innerHTML = '';

        const cardInstance = await paymentsInstance.card();
        await cardInstance.attach('#card-container');
        cardInstanceRef.current = cardInstance;
        setCard(cardInstance);
      } catch (e) {
        console.error('Failed to initialize Square payments:', e);
        setError('Failed to load payment form. Please refresh the page.');
        isInitializingRef.current = false;
      }
    };

    // Load Square.js script
    const existingScript = document.querySelector('script[src*="square.js"]');

    if (window.Square) {
      // Square is already loaded
      initSquare();
    } else if (!existingScript) {
      // Script doesn't exist, create it
      const scriptElement = document.createElement('script');
      scriptElement.src = 'https://sandbox.web.squarecdn.com/v1/square.js';
      scriptElement.async = true;
      scriptElement.onload = () => initSquare();
      scriptElement.onerror = () => {
        setError('Failed to load payment system. Please check your internet connection.');
        isInitializingRef.current = false;
      };
      document.body.appendChild(scriptElement);
    } else {
      // Script exists but may not be loaded yet, wait for it
      const checkSquareLoaded = setInterval(() => {
        if (window.Square) {
          clearInterval(checkSquareLoaded);
          initSquare();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkSquareLoaded);
        if (!window.Square) {
          setError('Failed to load payment system. Please refresh the page.');
          isInitializingRef.current = false;
        }
      }, 10000);
    }

    return () => {
      // Cleanup card instance
      if (cardInstanceRef.current) {
        try {
          cardInstanceRef.current.destroy();
        } catch (e) {
          console.log('Error during cleanup:', e);
        }
        cardInstanceRef.current = null;
      }
      isInitializingRef.current = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardInstanceRef.current) {
      setError('Payment form not ready. Please try again.');
      return;
    }

    setIsLoading(true);
    setError('');
    isProcessingPayment.current = true;

    try {
      // Tokenize card details
      const result = await cardInstanceRef.current.tokenize();

      if (result.status === 'OK') {
        // Send payment to server
        const response = await fetch('/api/process-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceId: result.token,
            amount: total,
            customerInfo: {
              email,
              firstName,
              lastName,
              phone,
            },
            fulfillmentMethod,
            shippingAddress:
              fulfillmentMethod === 'shipping'
                ? {
                    fullName: `${firstName} ${lastName}`,
                    addressLine1,
                    addressLine2,
                    city,
                    state,
                    postalCode,
                    country: 'US',
                  }
                : undefined,
            items: items.map((item) => ({
              productId: item.product.id,
              name: item.product.name,
              quantity: item.quantity,
              price: item.product.price,
            })),
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Clear cart and redirect to success page
          clearCart();
          router.push(`/products/success?orderId=${data.orderId}`);
          // Keep isProcessingPayment.current = true to prevent redirect back to /products
        } else {
          setError(data.error || 'Payment failed. Please try again.');
          isProcessingPayment.current = false;
        }
      } else {
        setError('Failed to process card. Please check your card details.');
        isProcessingPayment.current = false;
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An error occurred. Please try again.');
      isProcessingPayment.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return null; // Will redirect
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/products"
            className="text-sage-600 hover:text-sage-700 font-medium flex items-center gap-2"
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
            Back to Shop
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-sage-500 focus:border-sage-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-sage-500 focus:border-sage-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-sage-500 focus:border-sage-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-sage-500 focus:border-sage-500"
                    />
                  </div>
                </div>
              </div>

              {/* Fulfillment Method */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Fulfillment Method
                </h2>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 border-2 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="fulfillment"
                      value="pickup"
                      checked={fulfillmentMethod === 'pickup'}
                      onChange={() => setFulfillmentMethod('pickup')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        Pickup at Farm
                      </div>
                      <div className="text-sm text-gray-600">
                        Pick up your order at Olympic Bluffs Cidery & Lavender Farm
                      </div>
                    </div>
                    <div className="font-semibold text-sage-600">FREE</div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border-2 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="fulfillment"
                      value="shipping"
                      checked={fulfillmentMethod === 'shipping'}
                      onChange={() => setFulfillmentMethod('shipping')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Shipping</div>
                      <div className="text-sm text-gray-600">
                        Have your order shipped to your address
                      </div>
                    </div>
                    <div className="font-semibold text-gray-900">$10.00</div>
                  </label>
                </div>
              </div>

              {/* Shipping Address (conditional) */}
              {fulfillmentMethod === 'shipping' && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Shipping Address
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1 *
                      </label>
                      <input
                        type="text"
                        required={fulfillmentMethod === 'shipping'}
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-sage-500 focus:border-sage-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-sage-500 focus:border-sage-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          required={fulfillmentMethod === 'shipping'}
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-sage-500 focus:border-sage-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          required={fulfillmentMethod === 'shipping'}
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-sage-500 focus:border-sage-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP Code *
                        </label>
                        <input
                          type="text"
                          required={fulfillmentMethod === 'shipping'}
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-sage-500 focus:border-sage-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment Information
                </h2>
                <div id="card-container"></div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <OrderSummary shippingCost={shippingCost} />

                <button
                  type="submit"
                  disabled={isLoading || !card}
                  className="w-full mt-6 bg-sage-500 text-white px-6 py-3 rounded-md hover:bg-sage-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors"
                >
                  {isLoading ? 'Processing...' : `Pay $${(total / 100).toFixed(2)}`}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Your payment information is securely processed by Square.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Declare Square on window
declare global {
  interface Window {
    Square: any;
  }
}
