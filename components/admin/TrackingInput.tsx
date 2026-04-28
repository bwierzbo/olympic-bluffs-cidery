'use client';

import { useState } from 'react';

interface TrackingInputProps {
  currentTracking: string | null;
  onSubmit: (trackingNumber: string) => void;
  updating: boolean;
}

// Pull a tracking number out of pasted carrier/Pirate Ship tracking URLs.
// Falls through to the raw input if no known format is detected.
function extractTrackingNumber(input: string): string {
  const trimmed = input.trim();
  if (!/^https?:\/\//i.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const params = ['qtc_tLabels1', 'tracknum', 'tracknumbers', 'tracking', 'trackingnumber', 'tracking_number'];
    for (const p of params) {
      const v = url.searchParams.get(p);
      if (v) return v.trim();
    }
  } catch {
    // not a parseable URL — fall through to regex
  }

  const patterns = [
    /1Z[A-Z0-9]{16}/i,           // UPS
    /\b9[24]\d{20}\b/,           // USPS 22-digit
    /\b\d{20,22}\b/,             // USPS variant
    /\b\d{12,15}\b/,             // FedEx / others
  ];
  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m) return m[0];
  }

  return trimmed;
}

export default function TrackingInput({ currentTracking, onSubmit, updating }: TrackingInputProps) {
  const [value, setValue] = useState(currentTracking || '');
  const [editing, setEditing] = useState(!currentTracking);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const extracted = extractTrackingNumber(value);
    if (!extracted) return;
    onSubmit(extracted);
    setValue(extracted);
    setEditing(false);
  };

  if (!editing && currentTracking) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-gray-700">{currentTracking}</span>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-sage-600 hover:text-sage-700 font-medium"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Tracking number or paste a tracking URL"
        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
        disabled={updating}
      />
      <button
        type="submit"
        disabled={updating || !value.trim()}
        className="px-3 py-1.5 bg-sage-600 text-white rounded text-xs font-medium hover:bg-sage-700 disabled:opacity-50"
      >
        {updating ? 'Saving...' : 'Save'}
      </button>
      {currentTracking && (
        <button
          type="button"
          onClick={() => {
            setValue(currentTracking);
            setEditing(false);
          }}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      )}
    </form>
  );
}
