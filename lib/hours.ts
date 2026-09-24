import { getSiteConfig } from './site-config';

/**
 * Farm hours helpers. Hours live in config/site-config.json under `hours`
 * so the owners can change them without touching code. Everything is
 * computed in the farm's time zone (Pacific) regardless of where the
 * server runs.
 */

export const FARM_TIME_ZONE = 'America/Los_Angeles';

type DayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_NAMES: Record<DayKey, string> = {
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
};

export interface HoursConfig {
  /** ISO date the season opens, e.g. "2026-04-24". Optional. */
  seasonStart?: string;
  /** ISO date the season closes. Optional; omit for "until further notice". */
  seasonEnd?: string;
  /** 24h "HH:MM" open/close pairs per weekday. Missing day = closed. */
  weekly: Partial<Record<DayKey, [string, string]>>;
  /** One-line note shown under the hours table. */
  note?: string;
}

export interface TodayHours {
  /** Farm is open for the season (site-config farmStatus.isOpen) */
  inSeason: boolean;
  dayKey: DayKey;
  dayName: string;
  /** "12–5 pm" or null when closed today */
  todayLabel: string | null;
  /** Short label for the header pill: "Open today 12–5" / "Closed today · Fri–Sun 12–5" */
  headerLabel: string;
  /** Summary of the regular week: "Friday–Sunday, 12–5 pm" */
  weekSummary: string;
  /** Whether current time falls inside today's open window */
  isOpenNow: boolean;
}

function fmtTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = ((h + 11) % 12) + 1;
  return m ? `${hour}:${String(m).padStart(2, '0')} ${suffix}` : `${hour} ${suffix}`;
}

/** "12:00"/"17:00" -> "12–5 pm" (drops the first suffix when both match). */
export function formatRange(range: [string, string]): string {
  const [open, close] = range;
  const o = fmtTime(open);
  const c = fmtTime(close);
  const oSuffix = o.slice(-2);
  const cSuffix = c.slice(-2);
  return oSuffix === cSuffix ? `${o.slice(0, -3)}–${c}` : `${o}–${c}`;
}

export function getHoursConfig(): HoursConfig {
  const config = getSiteConfig() as unknown as { hours?: HoursConfig };
  return (
    config.hours ?? {
      weekly: { fri: ['12:00', '17:00'], sat: ['12:00', '17:00'], sun: ['12:00', '17:00'] },
    }
  );
}

/** Ordered list for an hours table: [{ day: 'Monday', label: 'Closed' }, ...] */
export function getWeeklyHours(): Array<{ key: DayKey; day: string; label: string; open: boolean }> {
  const { weekly } = getHoursConfig();
  const order: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  return order.map((key) => {
    const range = weekly[key];
    return {
      key,
      day: DAY_NAMES[key],
      label: range ? formatRange(range) : 'Closed',
      open: Boolean(range),
    };
  });
}

/** "Friday–Sunday, 12–5 pm" when consecutive days share hours; otherwise a list. */
export function getWeekSummary(): string {
  const { weekly } = getHoursConfig();
  const order: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const openDays = order.filter((d) => weekly[d]);
  if (openDays.length === 0) return 'Closed';
  const first = weekly[openDays[0]]!;
  const sameHours = openDays.every((d) => weekly[d]![0] === first[0] && weekly[d]![1] === first[1]);
  const consecutive = openDays.every(
    (d, i) => i === 0 || order.indexOf(d) === order.indexOf(openDays[i - 1]) + 1
  );
  if (sameHours && consecutive && openDays.length > 1) {
    return `${DAY_NAMES[openDays[0]]}–${DAY_NAMES[openDays[openDays.length - 1]]}, ${formatRange(first)}`;
  }
  return openDays.map((d) => `${DAY_NAMES[d].slice(0, 3)} ${formatRange(weekly[d]!)}`).join(' · ');
}

function farmNow(now: Date): { dayKey: DayKey; minutes: number; isoDate: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: FARM_TIME_ZONE,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const weekday = get('weekday').toLowerCase().slice(0, 3) as DayKey;
  const hour = Number(get('hour')) % 24;
  const minute = Number(get('minute'));
  return {
    dayKey: DAY_KEYS.includes(weekday) ? weekday : 'sun',
    minutes: hour * 60 + minute,
    isoDate: `${get('year')}-${get('month')}-${get('day')}`,
  };
}

export function getTodayHours(now: Date = new Date()): TodayHours {
  const config = getSiteConfig();
  const hours = getHoursConfig();
  const { dayKey, minutes, isoDate } = farmNow(now);

  let inSeason = config.seasonal.farmStatus.isOpen;
  if (hours.seasonStart && isoDate < hours.seasonStart) inSeason = false;
  if (hours.seasonEnd && isoDate > hours.seasonEnd) inSeason = false;

  const range = hours.weekly[dayKey];
  const weekSummary = getWeekSummary();
  const todayLabel = inSeason && range ? formatRange(range) : null;

  let isOpenNow = false;
  if (todayLabel && range) {
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    isOpenNow = minutes >= toMin(range[0]) && minutes < toMin(range[1]);
  }

  let headerLabel: string;
  if (!inSeason) headerLabel = 'Closed for the season';
  else if (todayLabel) headerLabel = `Open today ${todayLabel}`;
  else headerLabel = `Closed today · ${weekSummary}`;

  return {
    inSeason,
    dayKey,
    dayName: DAY_NAMES[dayKey],
    todayLabel,
    headerLabel,
    weekSummary,
    isOpenNow,
  };
}
