'use client';

import { useQuery } from '@tanstack/react-query';
import { authorizationApi } from './api';

/** Names for ids, from the directory — `Map<id, name>`; empty while it loads (screens fall back to the id). */
export function usePeopleNames(ids: readonly string[]): ReadonlyMap<string, string> {
  const unique = [...new Set(ids)].sort();
  const query = useQuery({
    queryKey: ['authz-names', unique],
    queryFn: () => authorizationApi.lookup(unique),
    enabled: unique.length > 0,
    staleTime: 5 * 60_000,
  });
  return new Map((query.data ?? []).map((u) => [u.id, u.name]));
}

/** The role catalog — one read every screen shares. */
export function useRoles() {
  return useQuery({ queryKey: ['authz-roles'], queryFn: () => authorizationApi.roles(), staleTime: 5 * 60_000 });
}

/** The action catalog with descriptions and scopes — one read every screen shares. */
export function useActionCatalog() {
  return useQuery({ queryKey: ['authz-actions'], queryFn: () => authorizationApi.actions(), staleTime: 5 * 60_000 });
}
