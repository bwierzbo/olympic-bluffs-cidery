'use client';

import { useEffect, useImperativeHandle, useRef, useState } from 'react';

// Minimal Square Web Payments SDK surface used here. The checkout page
// declares `window.Square` globally; we read it through a local cast instead
// of redeclaring the global.
interface SquareTokenizeResult {
  status: string;
  token?: string;
  errors?: Array<{ message?: string; field?: string }>;
}

interface SquareCard {
  attach: (target: string | HTMLElement) => Promise<void>;
  detach: () => Promise<void>;
  tokenize: () => Promise<SquareTokenizeResult>;
}

interface SquareSdk {
  payments: (appId: string, locId: string) => { card: () => Promise<SquareCard> };
}

interface SquareConfig {
  applicationId: string;
  locationId: string;
  cdnUrl: string;
}

function squareGlobal(): SquareSdk | undefined {
  return (window as unknown as { Square?: SquareSdk }).Square;
}

export interface SquareCardFieldHandle {
  /** Resolves to a card token, or rejects with a message fit to show the customer. */
  tokenize: () => Promise<string>;
}

/** Load square.js once per page; resolves when window.Square exists. */
function loadSquareScript(cdnUrl: string): Promise<void> {
  if (squareGlobal()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    // A script for a different environment (sandbox vs production) can't be reused.
    const existing = document.querySelector<HTMLScriptElement>('script[src*="square.js"]');
    if (existing && existing.getAttribute('src') !== cdnUrl) existing.remove();

    let script = document.querySelector<HTMLScriptElement>(`script[src="${cdnUrl}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = cdnUrl;
      script.async = true;
      document.body.appendChild(script);
    }
    const timeout = window.setTimeout(() => reject(new Error('timeout')), 10000);
    script.addEventListener('load', () => {
      window.clearTimeout(timeout);
      resolve();
    });
    script.addEventListener('error', () => {
      window.clearTimeout(timeout);
      reject(new Error('load'));
    });
  });
}

/**
 * Square's hosted card input (number, expiry, CVV, ZIP). Card data never
 * touches our server: the parent calls `ref.current.tokenize()` and posts the
 * token. The same instance can be tokenized again after a decline.
 */
export default function SquareCardField({
  ref,
  disabled = false,
}: {
  ref: React.Ref<SquareCardFieldHandle>;
  disabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<SquareCard | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch('/api/square-config');
        if (!res.ok) throw new Error('config');
        const config = (await res.json()) as SquareConfig;
        await loadSquareScript(config.cdnUrl);
        const sdk = squareGlobal();
        const container = containerRef.current;
        if (!alive || !container) return;
        if (!sdk) throw new Error('Square.js loaded without window.Square');

        const card = await sdk.payments(config.applicationId, config.locationId).card();
        if (!alive) return;
        await card.attach(container);
        // Unmounted while attaching (Strict Mode's double mount does this):
        // take this instance back off so only the live mount's card remains.
        if (!alive) {
          card.detach().catch(() => {});
          return;
        }
        cardRef.current = card;
        setStatus('ready');
      } catch (e) {
        console.error('Square card field failed to load:', e);
        if (alive) setStatus('error');
      }
    })();

    return () => {
      alive = false;
      const card = cardRef.current;
      cardRef.current = null;
      card?.detach().catch(() => {});
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      async tokenize() {
        const card = cardRef.current;
        if (!card) throw new Error('The card form is still loading. Try again in a moment.');
        const result = await card.tokenize();
        if (result.status === 'OK' && result.token) return result.token;
        const message = result.errors?.find((e) => e.message)?.message;
        throw new Error(message ?? 'Check your card details and try again.');
      },
    }),
    []
  );

  return (
    <div>
      <div
        ref={containerRef}
        aria-busy={status === 'loading'}
        className={`min-h-[89px] border border-line bg-paper px-3 pt-3 ${disabled ? 'pointer-events-none opacity-60' : ''}`}
      />
      {status === 'loading' && <p className="mt-2 text-[13px] text-ink-3">Loading the secure card form…</p>}
      {status === 'error' && (
        <p role="alert" className="mt-2 text-[13px] text-[#9b3b25]">
          The card form didn’t load. Refresh the page to try again.
        </p>
      )}
      <p className="mt-2 text-[12px] text-ink-3">Payments are processed securely by Square.</p>
    </div>
  );
}
