'use client';

import { useQuery } from '@tanstack/react-query';
import { sessionAuthAdapter } from './session-auth.adapter';

/**
 * The signed-in user, fetched once and shared — the shell's nav and any screen that adapts to who's looking (a
 * tenant admin sees no Tenant column) read the same cached query.
 */
export function useSession() {
  return useQuery({ queryKey: ['observability-session'], queryFn: () => sessionAuthAdapter.getSession() });
}
