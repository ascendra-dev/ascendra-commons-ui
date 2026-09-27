import type { FieldDiffEntry } from './audit-api.types';

/**
 * Field-level diff between an event's before/after snapshots — pure, so a
 * screen already holding both (any AuditEvent row) can compute this itself
 * instead of fetching AuditEventDetail just for its `diff`.
 */
export function diffFields(before: Record<string, unknown> | null, after: Record<string, unknown> | null): FieldDiffEntry[] {
  const b = before ?? {};
  const a = after ?? {};
  const fields = [...new Set([...Object.keys(b), ...Object.keys(a)])].sort();
  return fields
    .map((field) => ({ field, before: b[field] ?? null, after: a[field] ?? null }))
    .filter((entry) => JSON.stringify(entry.before) !== JSON.stringify(entry.after));
}
