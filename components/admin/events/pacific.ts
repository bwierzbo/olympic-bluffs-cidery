/**
 * The farm runs on Pacific time, so event dates and times are entered and
 * shown as Pacific wall-clock values no matter where the admin's browser is.
 * Offsets come from Intl so PST/PDT switch over on the right days.
 */

export const FARM_TIME_ZONE = 'America/Los_Angeles';

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: FARM_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function wallClockAt(ms: number): WallClock {
  const parts: Record<string, number> = {};
  for (const p of partsFormatter.formatToParts(new Date(ms))) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    // Some engines report midnight as 24 even with h23.
    hour: parts.hour === 24 ? 0 : parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

/** Milliseconds to add to UTC to get Pacific wall-clock time at that instant (negative). */
function pacificOffsetAt(ms: number): number {
  const w = wallClockAt(ms);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return asUtc - Math.floor(ms / 1000) * 1000;
}

/** "2026-10-12" + "14:30" (Pacific) → UTC ISO string, or null if either part is missing/invalid. */
export function pacificToIso(date: string, time: string): string | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const naive = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));
  if (Number.isNaN(naive)) return null;
  // Two passes: the offset at the guess can differ from the offset at the answer near a DST switch.
  const first = naive - pacificOffsetAt(naive);
  const second = naive - pacificOffsetAt(first);
  return new Date(second).toISOString();
}

/** UTC ISO → Pacific { date: "YYYY-MM-DD", time: "HH:mm" }. */
export function isoToPacific(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: '', time: '' };
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return { date: '', time: '' };
  const w = wallClockAt(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${w.year}-${pad(w.month)}-${pad(w.day)}`,
    time: `${pad(w.hour)}:${pad(w.minute)}`,
  };
}

/** "Sat, Oct 12, 2026" in Pacific time. */
export function formatPacificDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: FARM_TIME_ZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** "2:30 PM" in Pacific time. */
export function formatPacificTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone: FARM_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "Sat, Oct 12, 2026 · 2:00 PM – 4:00 PM" */
export function formatEventWhen(startsAt: string, endsAt: string): string {
  return `${formatPacificDate(startsAt)} · ${formatPacificTime(startsAt)} – ${formatPacificTime(endsAt)}`;
}

/** "Oct 12, 2026, 2:30 PM" in Pacific time. */
export function formatPacificDateTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    timeZone: FARM_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
