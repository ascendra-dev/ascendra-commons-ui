import { buildQuerySearch, type TriggerParams } from '@/ascendra-ui';

/**
 * Fixed base path (`/observability/idempotency`) — where `packages/observability` (the shell) mounts this module's
 * pages. `overview` is the landing page (nav.ts's target); `list` is Claims. The claim and trace are sheets, so they
 * have no link.
 */
export const idempotencyLinks = {
  overview: () => '/observability/idempotency',
  /** With a run — a query id from `idempotencyQueryIds` and its params — the list runs it on load (ascendra-ui's
   *  `buildQuerySearch`); without one it shows the table's last run. */
  list: (run?: { queryId: string; params?: TriggerParams }) =>
    run ? `/observability/idempotency/claims?${buildQuerySearch(run.queryId, run.params)}` : '/observability/idempotency/claims',
};
