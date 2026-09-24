'use client';

/**
 * A row of filter pills. One is active at a time. Used for the cider style
 * filter and the lavender category filter so both shops feel the same.
 */
export interface FilterOption {
  value: string;
  label: string;
}

export default function FilterPills({
  options,
  value,
  onChange,
  label,
}: {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] leading-none transition-colors ${
              active
                ? 'border-ink bg-ink text-white'
                : 'border-line text-ink-2 hover:border-ink hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
