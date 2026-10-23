import type { Delegation } from './api/authorization-api.types';

const DAY = 24 * 60 * 60 * 1000;

/** Readable names for an action's module — its prefix (`invoice.void` → Invoices). Unknown prefixes are capitalized. */
const MODULE_LABELS: Record<string, string> = {
  invoice: 'Invoices',
  payment: 'Payments',
  payout: 'Payouts',
  customer: 'Customers',
  report: 'Reports',
  audit: 'Audit log',
  authz: 'Access',
  'rate-limit': 'Rate limiting',
  idempotency: 'Idempotency',
  'domain-events': 'Domain events',
  job: 'Background jobs',
};

export const actionModule = (action: string): string => action.split('.')[0];

export function moduleLabel(module: string): string {
  return MODULE_LABELS[module] ?? module.charAt(0).toUpperCase() + module.slice(1).replace(/[-_]/g, ' ');
}

/** Actions grouped by module, modules and actions in name order. */
export function groupByModule<T>(items: readonly T[], actionOf: (item: T) => string): Array<{ module: string; label: string; items: T[] }> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const mod = actionModule(actionOf(item));
    groups.set(mod, [...(groups.get(mod) ?? []), item]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => moduleLabel(a).localeCompare(moduleLabel(b)))
    .map(([mod, list]) => ({ module: mod, label: moduleLabel(mod), items: [...list].sort((a, b) => actionOf(a).localeCompare(actionOf(b))) }));
}

export const daysUntil = (iso: string, now = Date.now()): number => Math.ceil((new Date(iso).getTime() - now) / DAY);

/** "expires today / tomorrow / in 3 days" — or `null` when further out than `withinDays`. */
export function expiresSoon(iso: string | null, withinDays = 7): string | null {
  if (!iso) return null;
  const days = daysUntil(iso);
  if (days < 0 || days > withinDays) return null;
  return days === 0 ? 'expires today' : days === 1 ? 'expires tomorrow' : `expires in ${days} days`;
}

/**
 * What a delegation is now, as the console shows it: `lapsed` (active, but lending something its lender lost —
 * those grant nothing), `expiring` (active, ending within 7 days), else its stored status.
 */
export type DelegationState = 'active' | 'lapsed' | 'expiring' | 'expired' | 'revoked';

export function delegationState(d: Delegation): DelegationState {
  if (d.status !== 'active') return d.status;
  if (d.lapsedActions.length > 0) return 'lapsed';
  return daysUntil(d.expiresAt) <= 7 ? 'expiring' : 'active';
}

export const DELEGATION_STATE: Record<DelegationState, { label: string; variant: 'default' | 'secondary' | 'red' | 'orange' | 'green' }> = {
  active: { label: 'active', variant: 'green' },
  lapsed: { label: 'lapsed', variant: 'red' },
  expiring: { label: 'expiring', variant: 'orange' },
  expired: { label: 'expired', variant: 'secondary' },
  revoked: { label: 'revoked', variant: 'secondary' },
};

/** A person's label: their name, else their id (someone the directory doesn't know — or outside the viewer's reach). */
export const personLabel = (id: string, names: ReadonlyMap<string, string>): string => names.get(id) ?? id;
