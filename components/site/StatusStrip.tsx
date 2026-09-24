import Link from 'next/link';
import { getTodayHours } from '@/lib/hours';
import { getNextEventAll } from '@/lib/events/listing';
import { getSiteConfig } from '@/lib/site-config';

/**
 * Dark strip under the homepage hero: today's open/closed status (same
 * logic as the header pill), the next event, and a link to the season
 * calendar. Replaces the old seasonal banner.
 * Everything here comes from site-config.json and data/events.json.
 */
export default async function StatusStrip() {
  const today = getTodayHours();
  const next = await getNextEventAll();
  const config = getSiteConfig();
  const custom = config.seasonal.banner.visible ? config.seasonal.banner.message : null;

  return (
    <div className="bg-ink text-white">
      <div className="container-x flex flex-wrap items-center gap-x-8 gap-y-2 py-3.5 text-[13px]">
        <span className="inline-flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${today.todayLabel ? 'bg-[#8fd0a5]' : 'bg-white/40'}`}
            aria-hidden="true"
          />
          {!today.inSeason ? (
            <b className="font-semibold">Closed for the season</b>
          ) : today.todayLabel ? (
            <>
              <b className="font-semibold">Open today</b>
              <span className="opacity-90">· {today.todayLabel}</span>
            </>
          ) : (
            <>
              <b className="font-semibold">Closed today</b>
              <span className="opacity-90">· Open {today.weekSummary}</span>
            </>
          )}
        </span>
        {next && (
          <span>
            <b className="font-semibold">Next up</b>{' '}
            <Link href={next.href} className="opacity-90 underline-offset-4 hover:underline">
              · {next.event.title}, {next.shortLabel.split(' · ')[1]}
            </Link>
          </span>
        )}
        {custom && !custom.toUpperCase().includes('OPEN FOR THE SEASON') && (
          <span className="opacity-90">{custom}</span>
        )}
        <span className="flex-1" />
        <Link href="/visit#season" className="underline underline-offset-4 opacity-85 hover:opacity-100">
          What’s pouring and what’s blooming
        </Link>
      </div>
    </div>
  );
}
