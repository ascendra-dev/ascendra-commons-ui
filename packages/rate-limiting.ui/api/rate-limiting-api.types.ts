/**
 * The wire shapes of `rate-limiting.api` (ascendra-commons), by hand — dates arrive as ISO strings. One row is one
 * rejection *window*: every 429 for one route, source, limit and correlation id within one minute, counted.
 */
export interface RateLimitRejection {
  id: string;
  /** The route pattern (`/pay/:token`), never a resolved URL. */
  route: string;
  /** What the throttler counted by — an IP, or `(overflow)` for sources beyond the recorder's buffer. */
  identifier: string;
  limit: number;
  ttlMs: number;
  /** The minute the rejections fell in. */
  windowStart: string;
  count: number;
  firstRejectedAt: string;
  lastRejectedAt: string;
  correlationId: string | null;
}

/** `GET /rate-limits/rejections/catalog` — one route's total over the period. */
export interface RouteRejectionCount {
  route: string;
  count: number;
}

/** `GET /rate-limits/rejections/top-identifiers` — one source's total, the routes it hit, when it was last turned away. */
export interface IdentifierRejectionCount {
  identifier: string;
  count: number;
  routes: string[];
  lastRejectedAt: string;
}

/** `GET /rate-limits/rejections/volume` — the Overview's Volume & retention card. */
export interface RejectionVolume {
  /** The oldest stored window — how far back the log goes. `null` when it's empty. */
  oldestWindowAt: string | null;
  rowCount: number;
  /** The whole table, every application sharing it included. */
  tableSizeBytes: number | null;
  /** The past 30 calendar days in the requested zone, oldest first, zero-filled. */
  perDay: Array<{ day: string; count: number }>;
}
