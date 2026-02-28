'use client';

import { useEffect, useRef, useState } from 'react';
import { OrderStatus } from '@/lib/types';
import { STATUS_CONFIG } from './StatusBadge';

const ALL_STATUSES: OrderStatus[] = [
  'confirmed',
  'on_hold',
  'processing',
  'ready',
  'shipped',
  'completed',
  'cancelled',
];

interface StatusFilterProps {
  /** Comma-separated status values, e.g. "confirmed,processing" */
  value: string;
  onChange: (value: string) => void;
}

export default function StatusFilter({ value, onChange }: StatusFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? value.split(',').filter(Boolean) : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (status: string) => {
    const next = selected.includes(status)
      ? selected.filter((s) => s !== status)
      : [...selected, status];
    onChange(next.join(','));
  };

  const label = selected.length === 0
    ? 'All Statuses'
    : selected.length === 1
      ? STATUS_CONFIG[selected[0] as OrderStatus]?.label ?? selected[0]
      : `${selected.length} statuses`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-md transition-colors ${
          selected.length > 0
            ? 'border-sage-300 bg-sage-50 text-sage-700'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
        {label}
        <svg className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-30 py-1">
          {ALL_STATUSES.map((status) => {
            const config = STATUS_CONFIG[status];
            const checked = selected.includes(status);

            return (
              <label
                key={status}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(status)}
                  className="rounded border-gray-300 text-sage-600 focus:ring-sage-500"
                />
                <span className={`inline-block w-2 h-2 rounded-full ${config.className.split(' ')[0]}`} />
                <span className="text-gray-700">{config.label}</span>
              </label>
            );
          })}
          {selected.length > 0 && (
            <>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => { onChange(''); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
              >
                Clear selection
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
