'use client';

import type { OrdersFilters } from '@/lib/hooks/useAdminOrders';
import SearchInput from './SearchInput';
import StatusFilter from './StatusFilter';
import FulfillmentFilter from './FulfillmentFilter';
import DateRangeFilter from './DateRangeFilter';
import PresetFilters from './PresetFilters';

interface FilterBarProps {
  filters: OrdersFilters;
  onFiltersChange: (filters: OrdersFilters) => void;
}

interface ActiveChip {
  key: string;
  label: string;
  onRemove: () => void;
}

function getActiveChips(
  filters: OrdersFilters,
  onFiltersChange: (f: OrdersFilters) => void
): ActiveChip[] {
  const chips: ActiveChip[] = [];

  if (filters.status) {
    const statuses = filters.status.split(',');
    statuses.forEach((s) => {
      chips.push({
        key: `status-${s}`,
        label: `Status: ${s.replace('_', ' ')}`,
        onRemove: () => {
          const remaining = statuses.filter((x) => x !== s).join(',');
          onFiltersChange({ ...filters, status: remaining || undefined });
        },
      });
    });
  }

  if (filters.fulfillment) {
    chips.push({
      key: 'fulfillment',
      label: `Fulfillment: ${filters.fulfillment}`,
      onRemove: () => onFiltersChange({ ...filters, fulfillment: undefined }),
    });
  }

  if (filters.dateFrom) {
    chips.push({
      key: 'dateFrom',
      label: `From: ${filters.dateFrom}`,
      onRemove: () => onFiltersChange({ ...filters, dateFrom: undefined }),
    });
  }

  if (filters.dateTo) {
    chips.push({
      key: 'dateTo',
      label: `To: ${filters.dateTo}`,
      onRemove: () => onFiltersChange({ ...filters, dateTo: undefined }),
    });
  }

  if (filters.search) {
    chips.push({
      key: 'search',
      label: `Search: "${filters.search}"`,
      onRemove: () => onFiltersChange({ ...filters, search: undefined }),
    });
  }

  return chips;
}

export default function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const chips = getActiveChips(filters, onFiltersChange);
  const hasActiveFilters = chips.length > 0;

  const clearAll = () => {
    onFiltersChange({ tab: filters.tab });
  };

  return (
    <div className="space-y-3 mb-4">
      {/* Filter controls row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <SearchInput
            value={filters.search ?? ''}
            onChange={(search) =>
              onFiltersChange({ ...filters, search: search || undefined })
            }
          />
        </div>

        <StatusFilter
          value={filters.status ?? ''}
          onChange={(status) =>
            onFiltersChange({ ...filters, status: status || undefined })
          }
        />

        <FulfillmentFilter
          value={filters.fulfillment ?? ''}
          onChange={(fulfillment) =>
            onFiltersChange({ ...filters, fulfillment: fulfillment || undefined })
          }
        />

        <DateRangeFilter
          dateFrom={filters.dateFrom ?? ''}
          dateTo={filters.dateTo ?? ''}
          onDateFromChange={(dateFrom) =>
            onFiltersChange({ ...filters, dateFrom: dateFrom || undefined })
          }
          onDateToChange={(dateTo) =>
            onFiltersChange({ ...filters, dateTo: dateTo || undefined })
          }
        />
      </div>

      {/* Presets row */}
      <PresetFilters currentFilters={filters} onApply={onFiltersChange} />

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-sage-50 text-sage-700 border border-sage-200"
            >
              {chip.label}
              <button
                onClick={chip.onRemove}
                className="ml-0.5 text-sage-400 hover:text-sage-600"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
