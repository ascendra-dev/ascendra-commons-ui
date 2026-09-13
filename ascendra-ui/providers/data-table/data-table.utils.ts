import type { ColumnDef, ColumnType } from './data-table.types';

const DATE_SUFFIX_RE = /(Date|At|On|Time)$/;

export function camelToTitle(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export function inferColumnType(key: string, val: unknown): ColumnType {
  if (val instanceof Date) return 'date';
  if (typeof val === 'number') return 'number';
  if (DATE_SUFFIX_RE.test(key)) return 'date';
  return 'string';
}

export function defineColumns<T extends object>(
  sample: T,
  keys: (keyof T)[],
  overrides?: { [K in keyof T]?: Partial<ColumnDef<T>> },
): ColumnDef<T>[] {
  return keys.map((key) => ({
    key,
    label: camelToTitle(String(key)),
    type: inferColumnType(String(key), sample[key]),
    ...overrides?.[key],
  }));
}
