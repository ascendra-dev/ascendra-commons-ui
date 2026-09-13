/**
 * Cross-module / cross-vertical link resolution.
 *
 * A commons module (e.g. `audit-logging.ui`) knows an `entityType` string like
 * `"invoice"` but not the vertical's route for it — that route is owned by
 * the vertical, not by any commons module. The vertical registers a resolver
 * once at boot; a module renders plain text for any `entityType` nobody
 * registered, instead of guessing a path shape that might not exist.
 */

export type EntityLinkResolver = (entityId: string) => string;

const resolvers = new Map<string, EntityLinkResolver>();

export function registerEntityLinkResolver(entityType: string, resolver: EntityLinkResolver): void {
  resolvers.set(entityType, resolver);
}

export function resolveEntityLink(entityType: string, entityId: string): string | null {
  return resolvers.get(entityType)?.(entityId) ?? null;
}

export function hasEntityLinkResolver(entityType: string): boolean {
  return resolvers.has(entityType);
}

/** Test-only: clear all registrations between test cases. */
export function resetEntityLinkResolvers(): void {
  resolvers.clear();
}
