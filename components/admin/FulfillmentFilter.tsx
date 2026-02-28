'use client';

interface FulfillmentFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'shipping', label: 'Shipping' },
] as const;

export default function FulfillmentFilter({ value, onChange }: FulfillmentFilterProps) {
  return (
    <div className="inline-flex rounded-md border border-gray-300 bg-white overflow-hidden">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            value === opt.value
              ? 'bg-sage-600 text-white'
              : 'text-gray-600 hover:bg-gray-50'
          } ${opt.value !== '' ? 'border-l border-gray-300' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
