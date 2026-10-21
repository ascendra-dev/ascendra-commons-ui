import { buildQuerySearch, type TriggerParams } from '@/ascendra-ui';

/**
 * Fixed base path (`/observability/rate-limiting`) — where `packages/observability` (the shell) mounts this module's
 * pages, as `audit-logging.ui` does with `audit/`. `overview` is the landing page (nav.ts's target); `list` is the
 * Rejections log; `retention` is Volume & Retention, a button on the overview. The trace is a sheet on the list, so it
 * has no link.
 */
export const rateLimitLinks = {
  overview: () => '/observability/rate-limiting',
  /** With a run — a query id from `rateLimitQueryIds` and its params — the list runs it on load (ascendra-ui's
   *  `buildQuerySearch`); without one it shows the table's last run. */
  list: (run?: { queryId: string; params?: TriggerParams }) =>
    run
      ? `/observability/rate-limiting/rejections?${buildQuerySearch(run.queryId, run.params)}`
      : '/observability/rate-limiting/rejections',
  retention: () => '/observability/rate-limiting/retention',
};
