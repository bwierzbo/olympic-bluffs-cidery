'use client';

import { useState } from 'react';

interface NoteInputProps {
  onSubmit: (note: string) => void;
  updating: boolean;
}

export default function NoteInput({ onSubmit, updating }: NoteInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a note..."
        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
        disabled={updating}
      />
      <button
        type="submit"
        disabled={updating || !value.trim()}
        className="px-3 py-1.5 bg-sage-600 text-white rounded text-xs font-medium hover:bg-sage-700 disabled:opacity-50"
      >
        {updating ? 'Adding...' : 'Add'}
      </button>
    </form>
  );
}
