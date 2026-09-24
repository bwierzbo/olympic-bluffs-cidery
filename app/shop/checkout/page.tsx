'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/shop/CartProvider';
import OrderSummary from '@/components/shop/OrderSummary';
import Link from 'next/link';

// Minimal Square Web Payments SDK surface used in this file.
// (Full typings aren't exported from 'square' for the Web Payments SDK.)
interface SquareCardInstance {
  attach: (selector: string) => Promise<void>;
  detach: () => Promise<void>;
  tokenize: () => Promise<{ status: string; token?: string }>;
}

interface SquarePaymentsInstance {
  card: () => Promise<SquareCardInstance>;
}

interface SquareSdk {
  payments: (appId: string, locId: string) => SquarePaymentsInstance;
}

// Minimal Google Places Autocomplete surface used in this file.
interface GoogleAutocompleteOptions {
  types?: string[];
  componentRestrictions?: { country: string | string[] };
  fields?: string[];
}

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GooglePlaceResult {
  address_components?: GoogleAddressComponent[];
  formatted_address?: string;
}

interface GoogleAutocomplete {
  addListener: (eventName: string, handler: () => void) => void;
  getPlace: () => GooglePlaceResult;
}

interface GoogleAutocompleteConstructor {
  new (input: HTMLInputElement, options?: GoogleAutocompleteOptions): GoogleAutocomplete;
}

interface GoogleMapsApi {
  places: {
    Autocomplete: GoogleAutocompleteConstructor;
  };
  event: {
    clearInstanceListeners: (instance: unknown) => void;
  };
}

declare global {
  interface Window {
    Square?: SquareSdk;
    google?: { maps: GoogleMapsApi };
  }
}

// Alias the global `google` symbol referenced at the top level of this file
// to our typed surface (no @types/google.maps dependency).
declare const google: { maps: GoogleMapsApi };

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Force a fresh mount on each checkout visit (Square SDK doesn't reset
  // cleanly otherwise). Start at 0 so SSR and the first client render match,
  // then bump in an effect after mount — bumping causes the div with this key
  // to remount, which is the desired effect.
  const [mountKey, setMountKey] = useState(0);
  useEffect(() => {
    setMountKey(Date.now());
  }, []);

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

  // Google Places Autocomplete
  const autocompleteRef = useRef<GoogleAutocomplete | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  // Square Payment
  const [card, setCard] = useState<SquareCardInstance | null>(null);
  const [, setPayments] = useState<SquarePaymentsInstance | null>(null);
  const cardInstanceRef = useRef<SquareCardInstance | null>(null);
  const isInitializingRef = useRef(false);
  const isProcessingPayment = useRef(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const shippingCost = fulfillmentMethod === 'shipping' ? 1995 : 0; // $19.95 flat rate shipping
  const total = totalAmount + shippingCost;

  // Redirect if cart is empty (but not during payment processing)
  useEffect(() => {
    if (items.length === 0 && !isProcessingPayment.current) {
      router.push('/lavender');
    }
  }, [items, router]);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    // Only initialize if shipping is selected and we have an input
    if (fulfillmentMethod !== 'shipping' || !addressInputRef.current) {
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GOOGLE_PLACES_API_KEY_HERE') {
      console.log('Google Places API key not configured');
      return;
    }

    // Check if Google Maps script is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      initAutocomplete();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => initAutocomplete();
    document.head.appendChild(script);

    function initAutocomplete() {
      if (!addressInputRef.current || autocompleteRef.current) return;

      const autocomplete = new google.maps.places.Autocomplete(addressInputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['address_components', 'formatted_address'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (!place.address_components) {
          return;
        }

        // Parse address components
        let streetNumber = '';
        let route = '';
        let locality = '';
        let administrativeArea = '';
        let postalCodeValue = '';

        place.address_components.forEach((component) => {
          const types = component.types;

          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          }
          if (types.includes('route')) {
            route = component.long_name;
          }
          if (types.includes('locality')) {
            locality = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            administrativeArea = component.short_name;
          }
          if (types.includes('postal_code')) {
            postalCodeValue = component.long_name;
          }
        });

        // Update form fields
        const fullAddress = `${streetNumber} ${route}`.trim();
        setAddressLine1(fullAddress);
        setCity(locality);
        setState(administrativeArea);
        setPostalCode(postalCodeValue);
      });

      autocompleteRef.current = autocomplete;
    }

    return () => {
      // Cleanup autocomplete listener
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [fulfillmentMethod]);

  // Initialize Square Web Payments SDK
  useEffect(() => {
    // Don't initialize if cart is empty
    if (items.length === 0) {
      return;
    }

    // Track if component is still mounted to prevent state updates after unmount
    let isMounted = true;

    const initSquare = async (appId: string, locId: string) => {
      if (!window.Square) {
        console.error('Square.js failed to load');
        if (isMounted) {
          setError('Payment system failed to load. Please refresh the page.');
        }
        return;
      }

      // Prevent duplicate initialization
      if (!isMounted || isInitializingRef.current || cardInstanceRef.current) {
        return;
      }
      isInitializingRef.current = true;

      try {
        // Check if the card container element exists
        const container = document.getElementById('card-container');
        if (!container || !isMounted) {
          isInitializingRef.current = false;
          if (isMounted) {
            setError('Payment form not ready. Please refresh the page.');
          }
          return;
        }

        // Check if container already has children (duplicate prevention)
        if (container.childNodes.length > 0) {
          console.log('Container already has content, skipping initialization');
          isInitializingRef.current = false;
          return;
        }

        const paymentsInstance = window.Square.payments(appId, locId);

        if (!isMounted) {
          isInitializingRef.current = false;
          return;
        }

        setPayments(paymentsInstance);

        const cardInstance = await paymentsInstance.card();

        if (!isMounted) {
          isInitializingRef.current = false;
          return;
        }

        await cardInstance.attach('#card-container');
        cardInstanceRef.current = cardInstance;
        setCard(cardInstance);
      } catch (e) {
        console.error('Failed to initialize Square payments:', e);
        if (isMounted) {
          setError('Failed to load payment form. Please refresh the page.');
        }
        isInitializingRef.current = false;
      }
    };

    // Fetch Square config from server then load the SDK
    const loadSquare = async () => {
      let cdnUrl = 'https://web.squarecdn.com/v1/square.js';
      let appId = '';
      let locId = '';

      try {
        const res = await fetch('/api/square-config');
        if (res.ok) {
          const config = await res.json();
          cdnUrl = config.cdnUrl;
          appId = config.applicationId;
          locId = config.locationId;
        }
      } catch {
        // Fall back to env vars
      }

      if (!isMounted) return;

      // Remove any existing Square script if CDN changed
      const existingScript = document.querySelector('script[src*="square.js"]');
      if (existingScript && existingScript.getAttribute('src') !== cdnUrl) {
        existingScript.remove();
        delete (window as { Square?: unknown }).Square;
      }

      if (window.Square) {
        initSquare(appId, locId);
      } else if (!document.querySelector(`script[src="${cdnUrl}"]`)) {
        const scriptElement = document.createElement('script');
        scriptElement.src = cdnUrl;
        scriptElement.async = true;
        scriptElement.onload = () => initSquare(appId, locId);
        scriptElement.onerror = () => {
          if (isMounted) {
            setError('Failed to load payment system. Please check your internet connection.');
          }
          isInitializingRef.current = false;
        };
        document.body.appendChild(scriptElement);
    } else {
      // Script exists but may not be loaded yet, wait for it
      checkIntervalRef.current = setInterval(() => {
        if (window.Square) {
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
          }
          initSquare(appId, locId);
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        if (!window.Square && isMounted) {
          setError('Failed to load payment system. Please refresh the page.');
          isInitializingRef.current = false;
        }
      }, 10000);
      }
    };

    loadSquare();

    return () => {
      isMounted = false;

      // Use detach() instead of destroy() - safer for SPA navigation
      if (cardInstanceRef.current) {
        cardInstanceRef.current.detach().catch((e: unknown) => {
          console.log('Error during detach:', e);
        });
        cardInstanceRef.current = null;
      }

      // Cleanup interval
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }

      isInitializingRef.current = false;
      setCard(null);
      setPayments(null);
    };
  }, [items.length]);

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
              price: item.selectedVariation?.price ?? item.product.price,
              ...(item.selectedVariation
                ? {
                    variation: {
                      id: item.selectedVariation.id,
                      name: item.selectedVariation.name,
                    },
                  }
                : {}),
            })),
          }),
        });

        const data = await response.json();
        console.log('Payment response:', data);

        if (data.success) {
          // Clear cart and redirect to success page
          clearCart();
          router.push(`/shop/success?orderId=${data.orderId}`);
          // Keep isProcessingPayment.current = true to prevent redirect back to /shop
        } else {
          console.log('Setting error:', data.error);
          setError(data.error || 'Payment failed. Please try again.');
          isProcessingPayment.current = false;
          // Scroll to top to show error message
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        setError('Failed to process card. Please check your card details.');
        isProcessingPayment.current = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An error occurred. Please try again.');
      isProcessingPayment.current = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  }

  if (items.length === 0) {
    return null; // Will redirect
  }

  const inputClass =
    'w-full rounded-md border border-line bg-paper px-3 py-2.5 text-[15px] text-ink focus:border-ink focus:outline-none';
  const labelClass = 'mb-1.5 block text-sm font-medium text-ink-2';
  const cardClass = 'border border-line bg-paper p-6';

  return (
    <section key={mountKey} className="bg-ground py-12 sm:py-16">
      <div className="container-x">
        <nav className="mb-6 text-sm text-ink-3" aria-label="Breadcrumb">
          <Link href="/lavender" className="hover:text-ink">
            Lavender shop
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink-2">Checkout</span>
        </nav>

        <p className="eyebrow text-lav">Lavender shop</p>
        <h1 className="mt-1.5 font-serif text-[clamp(32px,4.5vw,48px)] leading-[1.05]">Checkout</h1>
        <p className="mt-2 mb-8 text-sm text-ink-3">
          Lavender orders only. Cider checks out separately through VinoShipper.
        </p>

        {error && (
          <div className="mb-6 border border-line border-l-4 border-l-amber bg-paper px-4 py-3 text-sm text-ink" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left column: forms */}
            <div className="space-y-6 lg:col-span-2">
              {/* Customer information */}
              <div className={cardClass}>
                <h2 className="font-serif text-2xl leading-none">Contact</h2>
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className={labelClass}>
                      First name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      required
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className={labelClass}>
                      Last name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      required
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelClass}>
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Fulfillment method */}
              <div className={cardClass}>
                <h2 className="font-serif text-2xl leading-none">Pickup or shipping</h2>

                <div className="mt-5 space-y-3">
                  <label
                    className={`flex cursor-pointer items-start gap-3 border p-4 transition-colors ${
                      fulfillmentMethod === 'pickup' ? 'border-ink' : 'border-line hover:border-ink-3'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fulfillment"
                      value="pickup"
                      checked={fulfillmentMethod === 'pickup'}
                      onChange={() => setFulfillmentMethod('pickup')}
                      className="mt-1 accent-ink"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Pick up at the farm</div>
                      <div className="text-sm text-ink-2">We will email you when it is ready in the boutique.</div>
                    </div>
                    <div className="text-sm font-semibold">Free</div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 border p-4 transition-colors ${
                      fulfillmentMethod === 'shipping' ? 'border-ink' : 'border-line hover:border-ink-3'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fulfillment"
                      value="shipping"
                      checked={fulfillmentMethod === 'shipping'}
                      onChange={() => setFulfillmentMethod('shipping')}
                      className="mt-1 accent-ink"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Ship it</div>
                      <div className="text-sm text-ink-2">Flat rate, anywhere in the US.</div>
                    </div>
                    <div className="text-sm font-semibold">${(1995 / 100).toFixed(2)}</div>
                  </label>
                </div>
              </div>

              {/* Shipping address (conditional) */}
              {fulfillmentMethod === 'shipping' && (
                <div className={cardClass}>
                  <h2 className="font-serif text-2xl leading-none">Shipping address</h2>
                  <div className="mt-5 space-y-4">
                    <div>
                      <label htmlFor="addressLine1" className={labelClass}>
                        Address
                      </label>
                      <input
                        id="addressLine1"
                        ref={addressInputRef}
                        type="text"
                        required={fulfillmentMethod === 'shipping'}
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder="Start typing your address"
                        autoComplete="off"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="addressLine2" className={labelClass}>
                        Apartment, suite, etc. (optional)
                      </label>
                      <input
                        id="addressLine2"
                        type="text"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        autoComplete="off"
                        className={inputClass}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <label htmlFor="city" className={labelClass}>
                          City
                        </label>
                        <input
                          id="city"
                          type="text"
                          required={fulfillmentMethod === 'shipping'}
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          autoComplete="off"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="state" className={labelClass}>
                          State
                        </label>
                        <input
                          id="state"
                          type="text"
                          required={fulfillmentMethod === 'shipping'}
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          autoComplete="off"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="postalCode" className={labelClass}>
                          ZIP
                        </label>
                        <input
                          id="postalCode"
                          type="text"
                          required={fulfillmentMethod === 'shipping'}
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          autoComplete="off"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment */}
              <div className={cardClass}>
                <h2 className="font-serif text-2xl leading-none">Card</h2>
                <p className="mt-1.5 mb-5 text-xs text-ink-3">Processed by Square. Card details never touch our server.</p>
                <div id="card-container"></div>
              </div>
            </div>

            {/* Right column: order summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <OrderSummary shippingCost={shippingCost} />

                <button type="submit" disabled={isLoading || !card} className="btn btn-primary mt-6 w-full">
                  {isLoading ? 'Processing…' : `Pay $${(total / 100).toFixed(2)}`}
                </button>

                <p className="mt-4 text-center text-xs text-ink-3">Your payment is handled securely by Square.</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
