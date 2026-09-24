/**
 * Formatting helpers for ticketed events, shared by the server-rendered
 * detail page and the client-side registration form. Always farm time.
 */

const FARM_TZ = 'America/Los_Angeles';

function parts(d: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: FARM_TZ, ...opts }).format(d);
}

/** "10 am", "10:30 am" */
function clock(d: Date): string {
  // formatToParts, because ICU puts a narrow no-break space before "AM".
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: FARM_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === type)?.value ?? '';
  const m = get('minute');
  return `${get('hour')}${m === '00' ? '' : `:${m}`} ${get('dayPeriod').toLowerCase()}`;
}

/**
 * { date: "Saturday, October 11", time: "10 am – 1 pm" }. Multi-day events
 * get a date range and the start/end times.
 */
export function formatEventWhen(startsAt: string, endsAt: string): { date: string; time: string } {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const day = (d: Date) => parts(d, { weekday: 'long', month: 'long', day: 'numeric' });
  const startDay = day(start);
  const endDay = day(end);
  if (startDay === endDay) {
    return { date: startDay, time: `${clock(start)} – ${clock(end)}` };
  }
  return { date: `${startDay} – ${endDay}`, time: `${clock(start)} – ${clock(end)}` };
}

/** 4500 → "$45", 4550 → "$45.50" */
export function formatDollars(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

/** 9000 → "$90.00" (totals always show cents) */
export function formatTotal(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatSeatsLeft(seatsLeft: number, capacity: number): string {
  if (seatsLeft <= 0) return 'Sold out';
  return `${seatsLeft} of ${capacity} ${capacity === 1 ? 'seat' : 'seats'} left`;
}
