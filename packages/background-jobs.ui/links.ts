import { buildQuerySearch, type TriggerParams } from '@/ascendra-ui';

/**
 * Fixed base path (`/observability/background-jobs`) — where `packages/observability` (the shell) mounts this module's
 * pages. `overview` is the landing page (nav.ts's target); `list` is Runs; `job` is one job's screen; `locks` and
 * `retention` are buttons on the overview. The run and trace are sheets, so they have no link.
 */
export const backgroundJobsLinks = {
  overview: () => '/observability/background-jobs',
  /** With a run — a query id from `backgroundJobsQueryIds` and its params — the list runs it on load (ascendra-ui's
   *  `buildQuerySearch`); without one it shows the table's last run. */
  list: (run?: { queryId: string; params?: TriggerParams }) =>
    run
      ? `/observability/background-jobs/runs?${buildQuerySearch(run.queryId, run.params)}`
      : '/observability/background-jobs/runs',
  job: (name: string) => `/observability/background-jobs/jobs/${encodeURIComponent(name)}`,
  locks: () => '/observability/background-jobs/locks',
  retention: () => '/observability/background-jobs/retention',
};
