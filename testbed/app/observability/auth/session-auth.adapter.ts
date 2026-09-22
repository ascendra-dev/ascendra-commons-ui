import type { SessionAuthAdapter } from './session-auth.port';

/**
 * testbed has no real Supabase project wired (see packages/observability's
 * README) — this dev stand-in replaces the real Supabase-claims adapter so
 * nav filtering is actually visible/demoable. Toggle the constant below by
 * hand to see the Audit Log link appear/disappear, same manual-reconcile
 * pattern as swapping a screen's fetcher for a mock.
 */
const DEV_ALLOWED_ACTIONS: string[] = ['audit.view'];

export const sessionAuthAdapter: SessionAuthAdapter = {
  async getAllowedActions() {
    return DEV_ALLOWED_ACTIONS;
  },
};

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
