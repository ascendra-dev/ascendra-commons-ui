import type { EventCatalogEntry, ListenerBinding } from './api/domain-events-api.types';

/**
 * One event name's wiring — what fired (the delivery catalog, over a period) against what the code says listens (the
 * listener catalogue, live). Its checks are the three bugs neither read shows alone:
 *
 * - `criticalViaEmit` — an `@OnCriticalEvent()` listener, but some producer raised the event with `emit()`: that
 *   listener's failure is swallowed.
 * - `firesIntoNothing` — fired, and no listener is wired.
 * - `neverFires` — a listener is wired, but nothing raised the event in the period.
 */
export interface WiringRow {
  eventName: string;
  /** Null when it didn't fire in the period. */
  fired: EventCatalogEntry | null;
  listeners: ListenerBinding[];
  criticalViaEmit: boolean;
  firesIntoNothing: boolean;
  neverFires: boolean;
  /** Any of the three. */
  problem: boolean;
}

export type WiringCheck = 'criticalViaEmit' | 'firesIntoNothing' | 'neverFires';

/** Problems first — the worst (a swallowed critical failure) on top — then the busiest. */
const RANK: Record<WiringCheck, number> = { criticalViaEmit: 0, firesIntoNothing: 1, neverFires: 2 };

function rank(row: WiringRow): number {
  if (row.criticalViaEmit) return RANK.criticalViaEmit;
  if (row.firesIntoNothing) return RANK.firesIntoNothing;
  if (row.neverFires) return RANK.neverFires;
  return 3;
}

/** Every event name in either read, checked and sorted. */
export function wiringRows(catalog: readonly EventCatalogEntry[], listeners: readonly ListenerBinding[]): WiringRow[] {
  const names = new Set([...catalog.map((e) => e.eventName), ...listeners.map((l) => l.eventName)]);
  const fired = new Map(catalog.map((e) => [e.eventName, e]));
  const rows = [...names].map((eventName): WiringRow => {
    const entry = fired.get(eventName) ?? null;
    const bound = listeners.filter((l) => l.eventName === eventName);
    const criticalViaEmit = !!entry && entry.emitCount > 0 && bound.some((l) => l.critical);
    const firesIntoNothing = !!entry && bound.length === 0;
    const neverFires = !entry && bound.length > 0;
    return { eventName, fired: entry, listeners: bound, criticalViaEmit, firesIntoNothing, neverFires, problem: criticalViaEmit || firesIntoNothing || neverFires };
  });
  return rows.sort((a, b) => rank(a) - rank(b) || (b.fired?.total ?? 0) - (a.fired?.total ?? 0) || a.eventName.localeCompare(b.eventName));
}
