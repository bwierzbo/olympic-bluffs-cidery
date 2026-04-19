'use client';

import { useState } from 'react';

export default function TestEmailPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    customerEmail: { sent: boolean; error: string };
    farmEmail: { sent: boolean; error: string };
  } | null>(null);
  const [error, setError] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    setResult(null);
    setError('');

    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to send test emails');
        return;
      }

      setResult(await res.json());
    } catch {
      setError('Network error — could not reach server');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Test Email Notifications
      </button>

      {isOpen && (
        <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4 max-w-lg">
          <p className="text-sm text-gray-600 mb-3">
            Send a test order confirmation to a customer email and a new-order notification to info@olympicbluffs.com.
          </p>

          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Customer email address"
              required
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
            />
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 text-sm bg-sage-600 text-white rounded-md hover:bg-sage-700 disabled:opacity-50 whitespace-nowrap"
            >
              {sending ? 'Sending...' : 'Send Test'}
            </button>
          </form>

          {result && (
            <div className="mt-3 space-y-2 text-sm">
              <div className={`flex items-center gap-2 ${result.customerEmail.sent ? 'text-green-700' : 'text-red-700'}`}>
                <span>{result.customerEmail.sent ? '\u2713' : '\u2717'}</span>
                <span>
                  Customer confirmation → {email}
                  {result.customerEmail.error && (
                    <span className="text-red-500 block text-xs ml-5">{result.customerEmail.error}</span>
                  )}
                </span>
              </div>
              <div className={`flex items-center gap-2 ${result.farmEmail.sent ? 'text-green-700' : 'text-red-700'}`}>
                <span>{result.farmEmail.sent ? '\u2713' : '\u2717'}</span>
                <span>
                  Farm notification → info@olympicbluffs.com
                  {result.farmEmail.error && (
                    <span className="text-red-500 block text-xs ml-5">{result.farmEmail.error}</span>
                  )}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-3 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-md">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
