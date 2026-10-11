import { format, isValid, parse } from 'date-fns';
import type { DateRange } from 'react-day-picker';

/** Default typed/displayed format for an `editable` date picker — day first. */
export const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';

// A date-shaped piece of text: 1–2 digit day/month and a 4-digit year, in either order, with
// `/`, `-` or `.` between the parts. Finding these (rather than splitting on a dash) is what lets a
// range be typed in one box even when its dates themselves contain dashes.
const DATE_TOKEN = /\b(?:\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}[./-]\d{1,2}[./-]\d{1,2})\b/g;

/** `dateFormat` with `/` separators and 1-or-2-digit day/month, so `1/7/2026` reads like `01/07/2026`. */
function parsePattern(dateFormat: string) {
  return dateFormat.replace(/[./-]/g, '/').replace(/dd/g, 'd').replace(/MM/g, 'M');
}

function parseToken(token: string, dateFormat: string): Date | undefined {
  const date = parse(token.replace(/[.-]/g, '/'), parsePattern(dateFormat), new Date());
  return isValid(date) ? date : undefined;
}

export function formatDateText(date: Date, dateFormat: string) {
  return format(date, dateFormat);
}

export function formatRangeText(range: DateRange | undefined, dateFormat: string) {
  if (!range?.from) return '';
  const from = formatDateText(range.from, dateFormat);
  return range.to ? `${from} – ${formatDateText(range.to, dateFormat)}` : from;
}

/** Placeholder that shows the pattern to type, e.g. `dd/mm/yyyy`. */
export function formatHint(dateFormat: string) {
  return dateFormat.toLowerCase();
}

/**
 * What typed text means for a single date: `undefined` when empty (cleared), a Date when it is
 * exactly one readable date, `'invalid'` otherwise (the caller reverts to the last value).
 */
export function parseDateText(text: string, dateFormat: string): Date | undefined | 'invalid' {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  const tokens = trimmed.match(DATE_TOKEN) ?? [];
  if (tokens.length !== 1) return 'invalid';
  return parseToken(tokens[0], dateFormat) ?? 'invalid';
}

/**
 * What typed text means for a range: `undefined` when empty, `{ from }` for one date, an ordered
 * `{ from, to }` for two (an end typed first is swapped), `'invalid'` for anything unreadable or
 * more than two dates.
 */
export function parseRangeText(text: string, dateFormat: string): DateRange | undefined | 'invalid' {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  const tokens = trimmed.match(DATE_TOKEN) ?? [];
  if (tokens.length === 0 || tokens.length > 2) return 'invalid';
  const dates = tokens.map((token) => parseToken(token, dateFormat));
  if (dates.some((date) => !date)) return 'invalid';
  const [first, second] = dates as Date[];
  if (!second) return { from: first, to: undefined };
  return first <= second ? { from: first, to: second } : { from: second, to: first };
}
