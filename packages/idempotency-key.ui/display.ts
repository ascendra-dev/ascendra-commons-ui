import type { IdempotencyClaim } from './api/idempotency-key-api.types';

/** How a claim made before routes were recorded reads. */
export const NO_ROUTE_LABEL = '(no route)';

export const routeLabel = (route: string | null) => route ?? NO_ROUTE_LABEL;

/** A claim's status with its saved code: `completed · 201`, or `in progress`. */
export function claimStatusLabel(claim: Pick<IdempotencyClaim, 'status' | 'statusCode'>): string {
  if (claim.status === 'pending') return 'in progress';
  return claim.statusCode == null ? 'completed' : `completed · ${claim.statusCode}`;
}

/**
 * Its badge colour: in progress blue; a saved error orange — every retry within the store's window gets that same
 * error back ("my retry keeps failing"); a saved success green.
 */
export function claimStatusVariant(claim: Pick<IdempotencyClaim, 'status' | 'statusCode'>): 'blue' | 'orange' | 'green' {
  if (claim.status === 'pending') return 'blue';
  return claim.statusCode != null && claim.statusCode >= 400 ? 'orange' : 'green';
}

/** Repeat requests absorbed — replays plus 409s. */
export const duplicatesOf = (claim: Pick<IdempotencyClaim, 'replayCount' | 'conflictCount'>) =>
  claim.replayCount + claim.conflictCount;

/** A body size: `84 bytes`, `1.2 KB`. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

/** How long ago a claim was made, to the second for a recent one: `2 s`, `4 min`, `3 h`. */
export function ageLabel(createdAt: string, now: number): string {
  const seconds = Math.max(0, Math.round((now - Date.parse(createdAt)) / 1000));
  if (seconds < 60) return `${seconds} s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  return `${Math.floor(seconds / 3600)} h`;
}
