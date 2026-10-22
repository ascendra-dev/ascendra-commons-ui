/**
 * The wire shapes of `idempotency-key.api` (ascendra-commons), by hand — dates arrive as ISO strings. One claim is
 * the first request carrying an `Idempotency-Key` for a scope; its repeats are counted on it, never stored.
 */
export interface IdempotencyClaim {
  key: string;
  /** Whose key it is — the app's scope resolver decides (in the sandbox, the signed-in staff member's tenant). */
  scope: string;
  status: 'pending' | 'completed';
  /** The saved response's status code, once completed — what a retry is replayed. */
  statusCode: number | null;
  /** The saved response body's size; the body itself is `GET …/response`, a separate permission. */
  responseBytes: number | null;
  createdAt: string;
  /** Times a retry took this claim over as stale — the original may still have been running. */
  reclaimCount: number;
  /** Times a request finished after it had been taken over, and its result was discarded: the work ran twice. */
  lateCompleteNoOpCount: number;
  /** Repeat requests answered with the saved response. Counted in memory, written every ~10s. */
  replayCount: number;
  /** Repeat requests turned away with a 409 while this claim was in progress. */
  conflictCount: number;
  lastDuplicateAt: string | null;
  /** The endpoint's route pattern (`/payments/:id`); null for a claim made before routes were recorded. */
  route: string | null;
  correlationId: string | null;
}

/** `GET /idempotency-keys/health?since` — the Overview's tiles. */
export interface ClaimHealthSummary {
  pendingCount: number;
  completedCount: number;
  /** Claims taken over at least once. */
  reclaimedCount: number;
  /** Results discarded because the work ran twice. */
  lateCompleteNoOpTotal: number;
  replayTotal: number;
  conflictTotal: number;
  totalCount: number;
  /** The oldest claim the store still holds — whatever `since` asked for. Null when it's empty. */
  oldestRetainedAt: string | null;
}

/** `GET /idempotency-keys/routes?since` — one endpoint's claims and duplicates. */
export interface RouteClaimCount {
  route: string | null;
  claims: number;
  replays: number;
  conflicts: number;
  reclaimed: number;
  lateCompleteNoOps: number;
}

/** `GET /idempotency-keys/:scope/:key/response` — exactly what a retry is replayed. Needs `idempotency.view-response`. */
export interface SavedResponse {
  statusCode: number;
  body: unknown;
}
