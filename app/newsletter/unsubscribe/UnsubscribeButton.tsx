'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function UnsubscribeButton({ token }: { token: string }) {
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'error'>('idle');

  async function unsubscribe() {
    setState('working');
    try {
      const res = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div className="mt-5 max-w-[52ch] text-ink-2">
        <p>You’re unsubscribed. You won’t get any more newsletters from us.</p>
        <p className="mt-3">
          Changed your mind? Sign up again at the bottom of any page. <Link href="/" className="underline underline-offset-4">Back to the farm</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 max-w-[52ch]">
      <p className="text-ink-2">Press the button and we’ll stop sending you release days, bloom updates and festival news.</p>
      <button type="button" onClick={unsubscribe} disabled={state === 'working'} className="btn btn-primary mt-6">
        {state === 'working' ? 'Unsubscribing…' : 'Unsubscribe'}
      </button>
      {state === 'error' && (
        <p className="mt-3 text-sm text-[#9a2f2f]">That didn’t go through. Try again, or email info@olympicbluffs.com.</p>
      )}
    </div>
  );
}
