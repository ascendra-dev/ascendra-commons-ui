import { buildQuerySearch, type TriggerParams } from '@/ascendra-ui';

/**
 * Fixed base path (`/access`) — where `packages/access` (the console's shell) mounts this module's pages. Lists that
 * filter (People, Delegations, Denied requests) take a run — a query id from `authorizationQueryIds` and its params —
 * which the list runs on load (ascendra-ui's `buildQuerySearch`); without one they show the table's last run.
 */
const run = (path: string, query?: { queryId: string; params?: TriggerParams }) =>
  query ? `${path}?${buildQuerySearch(query.queryId, query.params)}` : path;

export const authorizationLinks = {
  overview: () => '/access',
  people: (query?: { queryId: string; params?: TriggerParams }) => run('/access/people', query),
  person: (id: string) => `/access/people/${encodeURIComponent(id)}`,
  roles: () => '/access/roles',
  role: (id: string) => `/access/roles/${encodeURIComponent(id)}`,
  delegations: (query?: { queryId: string; params?: TriggerParams }) => run('/access/delegations', query),
  /** `who` — the "Who can…" tab; with an action (and a person) it asks straight away. */
  checker: (q: { tab?: 'can' | 'who'; userId?: string; action?: string } = {}) => {
    const params = new URLSearchParams(Object.entries(q).filter(([, v]) => v) as [string, string][]);
    return params.size ? `/access/checker?${params}` : '/access/checker';
  },
  denials: (query?: { queryId: string; params?: TriggerParams }) => run('/access/denials', query),
  catalog: () => '/access/catalog',
  mine: () => '/access/me',
};
