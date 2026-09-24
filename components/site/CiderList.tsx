import { Cider } from '@/lib/ciders';
import CiderCard from './CiderCard';
import { Eyebrow, SectionTitle } from './Section';

/**
 * The single-bottle grid. Receives the list from the server page (VinoShipper
 * feed via lib/ciders.ts). Packs are shown separately above it.
 */
export default function CiderList({ ciders, buyable = true }: { ciders: Cider[]; buyable?: boolean }) {
  return (
    <div>
      <div className="mb-8">
        <Eyebrow>The ciders</Eyebrow>
        <SectionTitle className="max-w-[22ch]">
          {ciders.length > 0 ? `${ciders.length} ciders from one orchard` : 'The ciders'}
        </SectionTitle>
      </div>

      {ciders.length === 0 ? (
        <p className="text-ink-2">Nothing on the shelf right now.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ciders.map((cider, i) => (
            <CiderCard key={cider.slug} cider={cider} priority={i < 3} buyable={buyable} />
          ))}
        </div>
      )}
    </div>
  );
}
