'use client';

import { useState } from 'react';

interface TrackingInputProps {
  currentTracking: string | null;
  onSubmit: (trackingNumber: string) => void;
  updating: boolean;
}

export default function TrackingInput({ currentTracking, onSubmit, updating }: TrackingInputProps) {
  const [value, setValue] = useState(currentTracking || '');
  const [editing, setEditing] = useState(!currentTracking);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
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
        placeholder="e.g., 1Z999AA10123456784"
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
