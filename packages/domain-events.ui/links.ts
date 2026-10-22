import { buildQuerySearch, type TriggerParams } from '@/ascendra-ui';

/**
 * Fixed base path (`/observability/domain-events`) — where `packages/observability` (the shell) mounts this module's
 * pages. `overview` is the landing page (nav.ts's target); `list` is Deliveries; `wiring` and `retention` are buttons on
 * the overview. The trace is a sheet on the list, so it has no link.
 */
export const domainEventsLinks = {
  overview: () => '/observability/domain-events',
  /** With a run — a query id from `domainEventsQueryIds` and its params — the list runs it on load (ascendra-ui's
   *  `buildQuerySearch`); without one it shows the table's last run. */
  list: (run?: { queryId: string; params?: TriggerParams }) =>
    run
      ? `/observability/domain-events/deliveries?${buildQuerySearch(run.queryId, run.params)}`
      : '/observability/domain-events/deliveries',
  wiring: () => '/observability/domain-events/wiring',
  retention: () => '/observability/domain-events/retention',
};
