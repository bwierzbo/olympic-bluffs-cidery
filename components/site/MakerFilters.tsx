'use client';

import { useMemo, useState } from 'react';
import MakerCard from '@/components/site/MakerCard';
import type { Maker } from '@/lib/content';

type Filter =
  | { kind: 'all' }
  | { kind: 'where'; value: Maker['where'][number] }
  | { kind: 'craft'; value: string };

const FIXED: Array<{ key: string; label: string; filter: Filter }> = [
  { key: 'all', label: 'Everyone', filter: { kind: 'all' } },
  { key: 'boutique', label: 'In the boutique now', filter: { kind: 'where', value: 'boutique' } },
  { key: 'festival', label: 'Festival market', filter: { kind: 'where', value: 'festival' } },
  { key: 'collaborator', label: 'Partners', filter: { kind: 'where', value: 'collaborator' } },
];

function matches(maker: Maker, filter: Filter): boolean {
  if (filter.kind === 'all') return true;
  if (filter.kind === 'where') return maker.where.includes(filter.value);
  return maker.craft === filter.value;
}

/**
 * Filter pills plus the makers grid. The pill list is the fixed set (where on
 * the farm) followed by one pill per distinct craft in the data.
 */
export default function MakerFilters({ makers }: { makers: Maker[] }) {
  const [active, setActive] = useState('all');

  const pills = useMemo(() => {
    const crafts = Array.from(new Set(makers.map((m) => m.craft))).sort((a, b) => a.localeCompare(b));
    return [
      ...FIXED,
      ...crafts.map((craft) => ({ key: `craft:${craft}`, label: craft, filter: { kind: 'craft', value: craft } as Filter })),
    ];
  }, [makers]);

  const current = pills.find((p) => p.key === active) ?? pills[0];
  const shown = makers.filter((m) => matches(m, current.filter));

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter makers">
        {pills.map((pill) => {
          const on = pill.key === active;
          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => setActive(pill.key)}
              aria-pressed={on}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                on ? 'border-ink bg-ink text-white' : 'border-line text-ink-2 hover:border-ink/50 hover:text-ink'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {shown.length > 0 ? (
        <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((maker) => (
            <li key={maker.slug}>
              <MakerCard maker={maker} index={makers.indexOf(maker)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 font-serif text-lg italic text-ink-2">No one in this group yet.</p>
      )}
    </>
  );
}
