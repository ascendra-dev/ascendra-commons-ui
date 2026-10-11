import type { FieldDiffEntry } from './audit-api.types';

/**
 * Field-level diff between an event's before/after snapshots — pure, so a
 * screen already holding both (any AuditEvent row) can compute this itself
 * instead of fetching AuditEventDetail just for its `diff`. Same rules as the
 * backend's `diffFields` (audit-logging.core/field-diff.ts): nested plain
 * objects become dot paths (`address.street`), arrays are compared whole, and
 * a path missing on one side counts as `null` there.
 */
export function diffFields(before: Record<string, unknown> | null, after: Record<string, unknown> | null): FieldDiffEntry[] {
  const b = flattenPaths(before ?? {});
  const a = flattenPaths(after ?? {});
  const fields = [...new Set([...b.keys(), ...a.keys()])].sort();
  return fields
    .map((field) => ({ field, before: b.get(field) ?? null, after: a.get(field) ?? null }))
    .filter((entry) => JSON.stringify(entry.before) !== JSON.stringify(entry.after));
}

/**
 * Leaf values keyed by dot path, in key order. Recurses into plain objects
 * only; arrays, primitives and `null` are leaves, and so is an empty object
 * (so it doesn't vanish from the diff).
 */
export function flattenPaths(value: Record<string, unknown>, prefix = ''): Map<string, unknown> {
  const out = new Map<string, unknown>();
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(child) && Object.keys(child).length > 0) {
      for (const [childPath, leaf] of flattenPaths(child, path)) out.set(childPath, leaf);
    } else {
      out.set(path, child);
    }
  }
  return out;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
