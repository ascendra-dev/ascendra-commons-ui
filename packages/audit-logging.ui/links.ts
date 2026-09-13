/**
 * Fixed base path (`/audit-log`) — the simplest thing that works for a
 * single vertical. A per-vertical configurable base (so two verticals could
 * mount this module at different paths) is deferred until a second
 * consumer actually needs it — see the module README.
 */
export const auditLogLinks = {
  eventDetail: (id: string) => `/audit-log/events/${encodeURIComponent(id)}`,
  entityHistory: (entityType: string, entityId: string) =>
    `/audit-log/entities/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`,
  trace: (correlationId: string) => `/audit-log/trace/${encodeURIComponent(correlationId)}`,
};
