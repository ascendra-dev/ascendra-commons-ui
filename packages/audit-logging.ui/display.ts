/**
 * How an audit action reads on screen: `invoice.created`. The API keeps entity type and action apart — actions are
 * verb-only, so `created` alone would be ambiguous across entities — and every screen folds them back into one label
 * with this. Display only: the filters, the API and the CSV export keep the two fields separate.
 */
export function auditActionLabel(event: { entityType: string; action: string }): string {
  return `${event.entityType}.${event.action}`;
}
