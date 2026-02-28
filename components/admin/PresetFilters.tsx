'use client';

import type { OrdersFilters } from '@/lib/hooks/useAdminOrders';

interface Preset {
  label: string;
  filters: Partial<OrdersFilters>;
}

const PRESETS: Preset[] = [
  {
    label: 'Needs Attention',
    filters: { tab: 'active', status: 'confirmed,on_hold', fulfillment: '' },
  },
  {
    label: 'Ready to Ship',
    filters: { tab: 'active', status: 'processing', fulfillment: 'shipping' },
  },
  {
    label: 'Awaiting Pickup',
    filters: { tab: 'active', status: 'ready', fulfillment: 'pickup' },
  },
];

interface PresetFiltersProps {
  currentFilters: OrdersFilters;
  onApply: (filters: OrdersFilters) => void;
}

function isPresetActive(preset: Preset, current: OrdersFilters): boolean {
  return (
    (preset.filters.status ?? '') === (current.status ?? '') &&
    (preset.filters.fulfillment ?? '') === (current.fulfillment ?? '') &&
    (preset.filters.tab ?? 'active') === (current.tab ?? 'active')
  );
}

export default function PresetFilters({ currentFilters, onApply }: PresetFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Quick:</span>
      {PRESETS.map((preset) => {
        const active = isPresetActive(preset, currentFilters);

        return (
          <button
            key={preset.label}
            onClick={() => {
              if (active) {
                // Deactivate: clear filters back to just the tab
                onApply({ tab: currentFilters.tab });
              } else {
                onApply({
                  ...currentFilters,
                  ...preset.filters,
                  search: currentFilters.search,
                  dateFrom: currentFilters.dateFrom,
                  dateTo: currentFilters.dateTo,
                });
              }
            }}
            className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
              active
                ? 'bg-sage-600 text-white border-sage-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
