'use client';

import { useEffect, useState } from 'react';

// Temporary closure notice for August 21-22, 2026. Date check runs in the
// browser so the banner disappears on its own after the 22nd, even if the
// site isn't redeployed. Rendered after mount to avoid a hydration mismatch.
const CLOSURE_END = new Date(2026, 7, 22, 23, 59, 59); // Aug 22, 2026 local time
const CLOSURE_START = new Date(2026, 7, 21); // Aug 21, 2026 local time

export default function ClosureBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const now = new Date();
    setVisible(now >= CLOSURE_START && now <= CLOSURE_END);
  }, []);

  if (!visible) return null;

  return (
    <div className="bg-red-700 py-6 px-4">
      <div className="mx-auto max-w-7xl text-center">
        <p className="text-white text-2xl md:text-4xl font-bold tracking-wide uppercase">
          We are closed today &amp; tomorrow
        </p>
        <p className="text-white text-lg md:text-2xl font-semibold mt-2">
          Friday, August 21 &amp; Saturday, August 22
        </p>
        <p className="text-red-100 text-base md:text-lg mt-2">
          We&apos;ll reopen Sunday, August 23 at 12 pm. Thank you for understanding!
        </p>
      </div>
    </div>
  );
}
