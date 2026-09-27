import { differenceInCalendarDays, formatDistanceToNow } from 'date-fns';

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export type DateFormatStyle = 'short' | 'medium' | 'long' | 'relative';

export interface FormatDateTimeOptions {
  /** 'short' = "Sep 04", 'medium' = "Sep 04, 2026", 'long' = "September 04, 2026", 'relative' = "3 days ago". Default 'medium'. */
  style?: DateFormatStyle;
  /** Append time-of-day. Ignored when style is 'relative'. Default false. */
  time?: boolean;
  /** Beyond this many days old, 'relative' falls back to an absolute 'medium' date instead of e.g. "8 months ago". Default 7. */
  relativeFallbackDays?: number;
}

function formatAbsolute(date: Date, style: Exclude<DateFormatStyle, 'relative'>, time: boolean): string {
  const dateParts: Intl.DateTimeFormatOptions =
    style === 'short'
      ? { month: 'short', day: '2-digit' }
      : style === 'long'
        ? { month: 'long', day: '2-digit', year: 'numeric' }
        : { month: 'short', day: '2-digit', year: 'numeric' };
  const timeParts: Intl.DateTimeFormatOptions = time ? { hour: 'numeric', minute: '2-digit' } : {};
  return date.toLocaleString('en-US', { ...dateParts, ...timeParts });
}

/**
 * The common date/time formatter — sensible defaults ('medium', date-only),
 * with `style`/`time` for the alternatives and a 'relative' style ("3 days
 * ago") that auto-falls-back to an absolute date past `relativeFallbackDays`
 * so an old timestamp never reads as "8 months ago".
 */
export function formatDateTime(value: string | Date, options: FormatDateTimeOptions = {}): string {
  const { style = 'medium', time = false, relativeFallbackDays = 7 } = options;
  const date = typeof value === 'string' ? new Date(value) : value;

  if (style === 'relative') {
    const daysOld = Math.abs(differenceInCalendarDays(new Date(), date));
    if (daysOld > relativeFallbackDays) {
      return formatAbsolute(date, 'medium', time);
    }
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return formatAbsolute(date, style, time);
}

/** @deprecated Use `formatDateTime(value, { style: 'medium' })` instead. */
export function formatDate(iso: string): string {
  return formatDateTime(iso, { style: 'medium' });
}

export function formatAmount(amount: number, currency = 'PKR'): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatCount(value: number, compactThreshold = 10_000): string {
  if (value >= compactThreshold) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return value.toLocaleString('en-US');
}

export function formatSignedPercent(value: number, decimals = 1): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/** @deprecated Use `formatDateTime(value, { style: 'short' })` instead. */
export function formatShortDate(iso: string): string {
  return formatDateTime(iso, { style: 'short' });
}

/** @deprecated Use `formatDateTime(value, { style: 'medium' })` on each endpoint instead. */
export function formatDateRange(startIso: string, endIso: string): string {
  if (!startIso || !endIso) return '';
  return `${formatDateTime(startIso, { style: 'medium' })} – ${formatDateTime(endIso, { style: 'medium' })}`;
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text =
    value instanceof Date
      ? value.toISOString()
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export interface ObjectsToCsvOptions<T> {
  /** Keys to omit from the exported columns. */
  exclude?: (keyof T)[];
}

/**
 * Converts an array of flat objects into CSV text. Columns come from the
 * first row's own keys — every row is expected to share that shape. Each
 * cell is stringified by its own runtime type (a `Date` becomes its ISO
 * string, an object/array is JSON-stringified, everything else via
 * `String()`) rather than a type locked in from the first row, so a
 * nullable column still renders correctly across rows.
 */
export function objectsToCsv<T extends object>(
  data: T[],
  options: ObjectsToCsvOptions<T> = {},
): string {
  if (!data.length) return '';
  const exclude = new Set(options.exclude ?? []);
  const keys = (Object.keys(data[0]) as (keyof T)[]).filter((k) => !exclude.has(k));
  const header = keys.map((k) => csvCell(String(k)));
  const rows = data.map((row) => keys.map((k) => csvCell(row[k])));
  return [header, ...rows].map((r) => r.join(',')).join('\n');
}

export interface DownloadCsvOptions<T> extends ObjectsToCsvOptions<T> {
  /**
   * Base name, e.g. "audit-events.csv" — defaults to "export.csv" when
   * omitted. Either way, a timestamp is always inserted before the
   * extension (e.g. "audit-events-2026-09-27T05-42-10.csv"), so repeated
   * exports never overwrite one another.
   */
  filename?: string;
}

/** Inserts a timestamp before the extension, or appends one if there is none. */
function timestampFilename(name: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dot = name.lastIndexOf('.');
  return dot > 0 ? `${name.slice(0, dot)}-${stamp}${name.slice(dot)}` : `${name}-${stamp}`;
}

/** Builds CSV via `objectsToCsv` and triggers a browser file download. No-ops on an empty array. */
export function downloadCsv<T extends object>(
  data: T[],
  options: DownloadCsvOptions<T> = {},
): void {
  if (!data.length) return;
  const csv = objectsToCsv(data, options);
  const filename = timestampFilename(options.filename ?? 'export.csv');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
