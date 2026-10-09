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

/**
 * Per-action-verb dot color — for a timeline whose events all share the same
 * entityType (Entity History: one fixed entity), where `dotVariantForEntityType`
 * would color every row identically. The verb (the segment after the
 * module prefix, e.g. "created" in "invoice.created") is the dimension that
 * actually varies within one entity's own history, grouped by rough
 * semantic category — a new record (emerald), a state change (sky), or a
 * terminal/negative one (rose) — rather than one color per literal action
 * string, which would fragment for little benefit.
 */
const ACTION_VERB_DOT_VARIANT: Record<string, TimelineDotVariant> = {
  created: 'emerald',
  uploaded: 'emerald',
  role_granted: 'emerald',
  issued: 'sky',
  resolved: 'sky',
  paid: 'sky',
  route_set: 'sky',
  payment_failed: 'amber',
  void: 'rose',
  expired: 'rose',
  role_revoked: 'rose',
};

export function dotVariantForAction(action: string): TimelineDotVariant {
  const verb = action.split('.').slice(1).join('.');
  return ACTION_VERB_DOT_VARIANT[verb] ?? 'gray';
}
