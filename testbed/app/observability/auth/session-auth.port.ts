/**
 * The seam every module's nav visibility is filtered through — not a
 * hardcoded Supabase call, so a vertical on a different auth stack plugs in
 * its own implementation here instead of `session-auth.adapter.ts`'s
 * reference one. Mirrors the ports/adapters convention `ascendra-commons`
 * already uses for its own Model 1/2 swaps (authorization, notification, …).
 *
 * Nav is hidden, never disabled, for an action the caller doesn't hold —
 * matching `ascendra-commons/authorization`'s own `computeSessionSnapshot`
 * `/me` bootstrap contract this implements the frontend half of.
 */
export interface SessionAuthAdapter {
  getAllowedActions(): Promise<string[]>;
}
