/** Dot colors for audit timelines (the Entity History and Request / Job Trace sheets) — StatusDot's own variant set. */
export type TimelineDotVariant = 'violet' | 'sky' | 'emerald' | 'rose' | 'amber' | 'gray';

/**
 * Per-action-verb dot color, by meaning — used by both timeline sheets, so a
 * void or a failure stands out the same way in each. The verb (the segment
 * after the module prefix, e.g. "created" in "invoice.created") is grouped by rough
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
