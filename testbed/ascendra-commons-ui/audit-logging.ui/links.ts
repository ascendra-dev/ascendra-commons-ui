import { buildQuerySearch, type TriggerParams } from '@/ascendra-ui';

/**
 * Fixed base path (`/observability/audit`) — matches where
 * `packages/observability` (the shell) mounts this module's pages by
 * convention (`audit/`), under the shell's own default mount folder
 * (`app/observability/`). A per-vertical configurable shell mount path is
 * deferred until a second consumer actually needs a different one — see the
 * module README and `packages/observability`'s own README.
 *
 * `overview` (`/observability/audit` itself) is the module's landing page —
 * nav.ts's target, and where Retention & Volume goes back to; `list` is one
 * click away. A record's detail, an
 * entity's history, a trace and an actor's activity are sheets on the list,
 * not routes — so there's no link for them.
 */
export const auditLogLinks = {
  overview: () => '/observability/audit',
  /** With a run — a query id from `auditQueryIds` and its params — the list runs it on load (ascendra-ui's
   *  `buildQuerySearch`); without one it shows the table's last run. */
  list: (run?: { queryId: string; params?: TriggerParams }) =>
    run ? `/observability/audit/events?${buildQuerySearch(run.queryId, run.params)}` : '/observability/audit/events',
  retention: () => '/observability/audit/retention',
};
