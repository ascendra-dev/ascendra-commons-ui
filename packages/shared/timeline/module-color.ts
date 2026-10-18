/** Dot colors for audit timelines (the Entity History and Request / Job Trace sheets) — StatusDot's own variant set. */
export type TimelineDotVariant = 'violet' | 'sky' | 'emerald' | 'rose' | 'amber' | 'gray';

/**
 * Verb words by meaning, checked in this order — an ending or removal (rose) wins over a failure (amber), which wins
 * over a creation or addition (emerald). Words, not literal actions, so any app's vocabulary colors sensibly with no
 * setup: `role_revoked` is rose by `revoked`, `payment_failed` amber by `failed`, `user_invited` emerald by `invited`.
 */
const VERB_WORD_DOT_VARIANT: [TimelineDotVariant, Set<string>][] = [
  ['rose', new Set(['void', 'voided', 'deleted', 'removed', 'revoked', 'expired', 'cancelled', 'canceled', 'rejected', 'deactivated', 'disabled', 'suspended'])],
  ['amber', new Set(['failed', 'failure', 'error', 'declined', 'bounced'])],
  ['emerald', new Set(['created', 'added', 'uploaded', 'granted', 'invited', 'registered', 'activated', 'enabled', 'restored'])],
];

/**
 * Per-action dot color, by meaning — used by both timeline sheets, so a void or a failure stands out the same way in
 * each. The action (verb-only, `status_changed`; a dotted `invoice.created` works too) is split into words, and the
 * first meaning that matches a word picks the color; anything else — a state change like `issued`, `paid`, `updated` —
 * is sky.
 */
export function dotVariantForAction(action: string): TimelineDotVariant {
  const words = action.toLowerCase().split(/[._\-\s]+/);
  return VERB_WORD_DOT_VARIANT.find(([, verbs]) => words.some((w) => verbs.has(w)))?.[0] ?? 'sky';
}
