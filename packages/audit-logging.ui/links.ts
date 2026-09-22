/**
 * Fixed base path (`/observability/audit`) — matches where
 * `packages/observability` (the shell) mounts this module's pages by
 * convention (`audit/`), under the shell's own default mount folder
 * (`app/observability/`). A per-vertical configurable shell mount path is
 * deferred until a second consumer actually needs a different one — see the
 * module README and `packages/observability`'s own README.
 *
 * `/observability/audit` itself is the Overview (nav.ts's target, the
 * module's landing page); `list` is one click away.
 */
export const auditLogLinks = {
  list: () => '/observability/audit/events',
  eventDetail: (id: string) => `/observability/audit/events/${encodeURIComponent(id)}`,
  entityHistory: (entityType: string, entityId: string) =>
    `/observability/audit/entities/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`,
  trace: (correlationId: string) => `/observability/audit/trace/${encodeURIComponent(correlationId)}`,
  actorActivity: (actor: string) => `/observability/audit/actors/${encodeURIComponent(actor)}`,
  retention: () => '/observability/audit/retention',
};
