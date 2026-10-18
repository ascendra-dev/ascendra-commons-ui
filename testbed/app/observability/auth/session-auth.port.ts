/** Who is signed in, as far as module screens need to know. */
export interface SessionActor {
  id: string;
  /** `null` for a platform-level actor, who reads across tenants. */
  tenantId: string | null;
}

/**
 * The signed-in user as every module's nav and screens see it — matching
 * `ascendra-commons/authorization`'s `computeSessionSnapshot` (`GET /me` →
 * `{ actor, allowedActions }`), which this is the frontend half of.
 * `actor` is `null` when signed out (or unknown).
 */
export interface SessionSnapshot {
  actor: SessionActor | null;
  allowedActions: string[];
}

/**
 * The seam the shell reads the session through — not a hardcoded Supabase
 * call, so a vertical on a different auth stack plugs in its own
 * implementation here instead of `session-auth.adapter.ts`'s reference
 * ones. Mirrors the ports/adapters convention `ascendra-commons` already
 * uses for its own Model 1/2 swaps (authorization, notification, …).
 *
 * Nav is hidden, never disabled, for an action the caller doesn't hold.
 */
export interface SessionAuthAdapter {
  getSession(): Promise<SessionSnapshot>;
}
