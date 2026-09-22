import type { SessionAuthAdapter } from './session-auth.port';

/**
 * Reference implementation for the common case: permissions carried as
 * custom claims (`allowedActions`/`capabilities`) on a Supabase access
 * token, decoded client-side — mirrors `ascendra-pay-web`'s
 * `lib/auth.ts` / `hooks/session.hook.ts` (`getBrowserSessionClaims()`), no
 * extra network round-trip. Token *retrieval* is left to the caller
 * (`getAccessToken`) rather than importing `@supabase/supabase-js` here —
 * this package stays dependency-free and works with however the vertical's
 * own Supabase client is already configured.
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

/**
 * The adapter `layout.tsx` actually uses — swap this file's export (or the
 * import in `layout.tsx`) for your own `SessionAuthAdapter` if you're not on
 * Supabase, same "replace one file" convention as any other adapter split in
 * this codebase. Out of the box, with no `getAccessToken` wired, this
 * returns no permissions — every nav entry stays hidden until configured
 * (fail closed, not open).
 */
export const sessionAuthAdapter: SessionAuthAdapter = createSupabaseClaimsAdapter(() => null);
