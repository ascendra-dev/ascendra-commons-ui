import { buildQuerySearch, type TriggerParams } from '@/ascendra-ui';

/**
 * Fixed base path (`/notifications`) — where `packages/notifications` (the console's shell) mounts this module's
 * pages. Deliveries take a run — a query id from `notificationQueryIds` and its params — which the list runs on load
 * (ascendra-ui's `buildQuerySearch`); without one it shows the table's last run.
 */
const run = (path: string, query?: { queryId: string; params?: TriggerParams }) =>
  query ? `${path}?${buildQuerySearch(query.queryId, query.params)}` : path;

export const notificationLinks = {
  overview: () => '/notifications',
  deliveries: (query?: { queryId: string; params?: TriggerParams }) => run('/notifications/deliveries', query),
};
