/** The identifier the recorder counts a rejection under once its buffer is full — many sources, counted together. */
export const OVERFLOW_IDENTIFIER = '(overflow)';

export const isOverflow = (identifier: string) => identifier === OVERFLOW_IDENTIFIER;

/** How a source reads on screen — `(overflow)` says what it is. */
export function sourceLabel(identifier: string): string {
  return isOverflow(identifier) ? 'Many sources (overflow)' : identifier;
}

/** A throttle window: `60s`, or `5 min` from two minutes up. */
function formatTtl(ms: number): string {
  return ms >= 120_000 && ms % 60_000 === 0 ? `${ms / 60_000} min` : `${Math.round(ms / 1000)}s`;
}

/** The limit a row exceeded: `20 / 60s`. */
export function limitLabel(row: { limit: number; ttlMs: number }): string {
  return `${row.limit} / ${formatTtl(row.ttlMs)}`;
}

/**
 * How long the minute's rejections lasted, first to last: `<1s` for one instant burst, `56s` for a steady drip — the
 * difference between a script and a misbehaving client.
 */
export function spanLabel(row: { firstRejectedAt: string; lastRejectedAt: string }): string {
  const seconds = Math.round((Date.parse(row.lastRejectedAt) - Date.parse(row.firstRejectedAt)) / 1000);
  return seconds < 1 ? '<1s' : `${seconds}s`;
}
