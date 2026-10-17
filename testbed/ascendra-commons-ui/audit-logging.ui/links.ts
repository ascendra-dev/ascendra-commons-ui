/**
 * Fixed base path (`/observability/audit`) — matches where
 * `packages/observability` (the shell) mounts this module's pages by
 * convention (`audit/`), under the shell's own default mount folder
 * (`app/observability/`). A per-vertical configurable shell mount path is
 * deferred until a second consumer actually needs a different one — see the
 * module README and `packages/observability`'s own README.
 *
 * `/observability/audit` itself is the Overview (nav.ts's target, the
 * module's landing page); `list` is one click away. A record's detail, an
 * entity's history, a trace and an actor's activity are sheets on the list,
 * not routes — so there's no link for them.
 */
export const auditLogLinks = {
  list: () => '/observability/audit/events',
  retention: () => '/observability/audit/retention',
};
