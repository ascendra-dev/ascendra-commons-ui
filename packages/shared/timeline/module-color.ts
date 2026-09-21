/**
 * Consistent per-entity-type dot color for timelines (Entity History,
 * Request/Job Trace) — matches `StatusDot`'s own variant set.
 *
 * audit-logging.api/mocks.html's own Trace mock colors dots by *module*
 * (payments/invoicing/notification), illustrating a future unified,
 * cross-module trace. `GET /audit/trace/:correlationId` today only returns
 * audit-logging's own records — there is no real "module" field to color by
 * yet (see that endpoint's own README: a unified trace stitching
 * notification.api/background-jobs.api in too is explicitly future work,
 * owned by whichever console builds it). Coloring by `entityType` instead is
 * the closest honestly-derivable equivalent from data that actually exists
 * today; revisit if/when a real cross-module trace ships.
 */
export type TimelineDotVariant = 'violet' | 'sky' | 'emerald' | 'rose' | 'amber' | 'gray';

const ENTITY_TYPE_DOT_VARIANT: Record<string, TimelineDotVariant> = {
  invoice: 'violet',
  payment: 'sky',
  'payment-link': 'sky',
  user: 'rose',
  attachment: 'amber',
  channel_route: 'emerald',
};

export function dotVariantForEntityType(entityType: string): TimelineDotVariant {
  return ENTITY_TYPE_DOT_VARIANT[entityType] ?? 'gray';
}
