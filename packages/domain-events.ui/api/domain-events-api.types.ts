/**
 * The wire shapes of `domain-events.api` (ascendra-commons), by hand — dates arrive as ISO strings. One delivery is one
 * `emit()` / `emitCritical()` call: was anyone subscribed, did the hand-off happen — never what a listener then did,
 * never the payload.
 */
export type DeliveryMethod = 'emit' | 'emitCritical';
export type DeliveryStatus = 'delivered' | 'no_listeners' | 'dispatch_failed';

export interface EventDelivery {
  id: string;
  eventName: string;
  method: DeliveryMethod;
  transport: string;
  /** When the event happened — what every screen filters, sorts and counts by. */
  occurredAt: string;
  deliveredAt: string;
  /** Listeners subscribed at that moment. */
  listenerCount: number;
  status: DeliveryStatus;
  /** Set only for `dispatch_failed`. */
  reason: string | null;
  correlationId: string | null;
}

/** `GET /domain-events/deliveries/summary` — the Overview's tiles over a period. */
export interface DeliverySummary {
  total: number;
  delivered: number;
  noListeners: number;
  dispatchFailed: number;
  /** Raised with `emitCritical()`. */
  critical: number;
  eventNames: number;
}

/** `GET /domain-events/deliveries/catalog` — one event name over a period, most deliveries first. */
export interface EventCatalogEntry {
  eventName: string;
  total: number;
  emitCount: number;
  emitCriticalCount: number;
  noListenerCount: number;
  dispatchFailedCount: number;
  lastOccurredAt: string;
  /** Listeners subscribed at the most recent delivery. */
  lastListenerCount: number;
}

/** `GET /domain-events/listener-catalog` — one `@OnEvent()` / `@OnCriticalEvent()` binding in the running app. */
export interface ListenerBinding {
  eventName: string;
  listenerClass: string;
  listenerMethod: string;
  /** `@OnCriticalEvent()` — its failure must reach an `emitCritical()` producer. */
  critical: boolean;
}

/** `GET /domain-events/deliveries/volume` — the Volume & Retention screen. */
export interface DeliveryVolume {
  /** The oldest stored delivery's occurrence — how far back the log goes. `null` when it's empty. */
  oldestOccurredAt: string | null;
  rowCount: number;
  /** The whole table, every application sharing it included. */
  tableSizeBytes: number | null;
  /** The past 30 calendar days in the requested zone, oldest first, zero-filled. */
  perDay: Array<{ day: string; count: number; noListenerCount: number; dispatchFailedCount: number }>;
}
