'use client';

import { useEffect } from 'react';

/**
 * Loads VinoShipper's injector and initializes it for our producer account.
 * Renders nothing itself. Any element on the page with
 * `class="vs-add-to-cart" data-vs-product-id="…"` becomes a working
 * Add to Cart control wired to VinoShipper's cart and checkout (cider has to
 * sell through a licensed shipper, separately from the Square lavender cart).
 *
 * We keep our own product cards and only borrow the button, so there is one
 * listing per cider instead of our card plus VinoShipper's tile.
 */

const PRODUCER_ID = 5980;

interface VinoshipperInitOptions {
  cartPosition: string;
  cartButton: boolean;
  addToCartStyle?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
}

interface VinoshipperApi {
  init: (id: number, options: VinoshipperInitOptions) => void;
  render?: () => void;
  cartOpen?: () => void;
}

function getVinoshipper(): VinoshipperApi | undefined {
  return (window as unknown as { Vinoshipper?: VinoshipperApi }).Vinoshipper;
}

const CART_UI = '[class*="vs-cart"], [class*="vs-button"], .vs-cart-button';

export default function VinoShipperLoader() {
  useEffect(() => {
    const handleLoaded = () => {
      getVinoshipper()?.init(PRODUCER_ID, {
        cartPosition: 'end',
        cartButton: false,
        // We style the Add to Cart control ourselves (globals.css, .vs-add-to-cart).
        addToCartStyle: false,
        primaryColor: '#1f2a22', // ink
        secondaryColor: '#5e6b5a', // sage
      });
    };

    const vs = getVinoshipper();
    if (vs) {
      // Script already loaded from a previous visit. `vinoshipper:loaded` is a
      // one-shot event tied to script load and won't re-fire on client-side
      // navigation. React recreated the .vs-add-to-cart elements on this
      // mount; render() re-scans the DOM and only touches unrendered ones.
      if (typeof vs.render === 'function') {
        vs.render();
      } else {
        handleLoaded();
      }
      document.querySelectorAll<HTMLElement>(CART_UI).forEach((el) => (el.style.display = ''));
    } else {
      document.addEventListener('vinoshipper:loaded', handleLoaded, false);
      if (!document.querySelector('script[src*="vinoshipper.com/injector"]')) {
        const script = document.createElement('script');
        script.src = 'https://vinoshipper.com/injector/index.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }

    return () => {
      document.removeEventListener('vinoshipper:loaded', handleLoaded);
      // Hide VinoShipper's cart UI when leaving cider pages (undone on re-entry).
      document.querySelectorAll<HTMLElement>(CART_UI).forEach((el) => (el.style.display = 'none'));
    };
  }, []);

  return null;
}
