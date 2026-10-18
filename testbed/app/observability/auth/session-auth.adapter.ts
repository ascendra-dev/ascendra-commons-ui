import { api } from '@/ascendra-ui/lib/api';
import type { SessionAuthAdapter } from './session-auth.port';

/**
 * For a backend that serves `ascendra-commons/authorization`'s session
 * snapshot (`computeSessionSnapshot`, typically `GET /me` →
 * `{ actor, allowedActions }`): one round-trip, permissions straight from the
 * server's own authorizer. Any failure — signed out (401), backend down —
 * reads as "holds nothing", so nav is hidden rather than shown and then
 * refused (deny by default).
 */
export function createSessionSnapshotAdapter(
  getSnapshot: () => Promise<{ allowedActions: string[] }>,
): SessionAuthAdapter {
  return {
    async getAllowedActions() {
      try {
        return (await getSnapshot()).allowedActions;
      } catch {
        return [];
      }
    },
  };
}

/** The adapter this shell uses: the backend's `GET /me` (ascendra-commons-sandbox serves one). */
export const sessionAuthAdapter = createSessionSnapshotAdapter(() =>
  api.get<{ allowedActions: string[] }>('/me'),
);

/**
 * Reference implementation for the common case: permissions carried as
 * custom claims (`allowedActions`/`capabilities`) on a Supabase access
 * token, decoded client-side — mirrors `ascendra-pay-web`'s
 * `lib/auth.ts` / `hooks/session.hook.ts` (`getBrowserSessionClaims()`), no
 * extra network round-trip. Token *retrieval* is left to the caller
 * (`getAccessToken`) rather than importing `@supabase/supabase-js` here —
 * this package stays dependency-free and works with however the vertical's
 * own Supabase client is already configured. Kept here for reference; not
 * the adapter actually used by testbed (see `sessionAuthAdapter` above).
 */
function decodeJwtClaims(token: string): Record<string, unknown> {
  const payload = token.split('.')[1];
  if (!payload) return {};
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  try {
    const json =
      typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function createSupabaseClaimsAdapter(
  getAccessToken: () => Promise<string | null> | string | null,
): SessionAuthAdapter {
  return {
    async getAllowedActions() {
      const token = await getAccessToken();
      if (!token) return [];
      const claims = decodeJwtClaims(token);
      const actions = claims.allowedActions ?? claims.capabilities;
      return Array.isArray(actions) ? actions.filter((a): a is string => typeof a === 'string') : [];
    },
  };
}
