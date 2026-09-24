'use client';

import { useState } from 'react';

/**
 * Newsletter signup. Posts to /api/newsletter, which stores the address in
 * the database (NewsletterSignup). A provider (Mailchimp, Square Marketing…)
 * is a stakeholder decision; until one is chosen the list lives in our DB.
 */
export default function NewsletterForm({ source = 'footer' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setState('done');
        setMessage('You’re on the list.');
      } else {
        setState('error');
        setMessage(data.error || 'Something went wrong. Try again in a minute.');
      }
    } catch {
      setState('error');
      setMessage('Something went wrong. Try again in a minute.');
    }
  }

  if (state === 'done') {
    return <p className="text-sm opacity-90">{message}</p>;
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <label htmlFor={`newsletter-email-${source}`} className="sr-only">
          Email address
        </label>
        <input
          id={`newsletter-email-${source}`}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="min-w-0 flex-1 rounded-full border border-white/35 bg-transparent px-4 py-2 text-sm placeholder:text-white/50 focus:border-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === 'sending'}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {state === 'sending' ? 'Adding…' : 'Subscribe'}
        </button>
      </div>
      {state === 'error' && <p className="text-xs text-[#f3c9b0]">{message}</p>}
    </form>
  );
}
