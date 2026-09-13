import type { DateRange } from 'react-day-picker';
import type { QueryParamValues, SavedUserQuery } from '@/ascendra-ui/providers/data-table-query/data-table-query.types';
import type { PresetQueryPrefs, StoredSavedUserQuery, TablePreferences, UserPreferences } from './preferences.types';

const STORAGE_KEY = 'ascendra:user-preferences';

function read(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { tables: {} };
    return JSON.parse(raw) as UserPreferences;
  } catch {
    return { tables: {} };
  }
}

function write(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // quota exceeded or non-browser environment — silently ignore
  }
}

export function readTablePreferences(tableId: string): TablePreferences | null {
  return read().tables[tableId] ?? null;
}

export function writeTablePreferences(tableId: string, patch: TablePreferences): void {
  const prefs = read();
  prefs.tables[tableId] = { ...prefs.tables[tableId], ...patch };
  write(prefs);
}

export function serializeParamValues(values: QueryParamValues): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(values)) {
    if (val instanceof Date) {
      result[key] = { __type: 'Date', value: val.toISOString() };
    } else if (val && typeof val === 'object' && !Array.isArray(val) && 'from' in val) {
      const range = val as DateRange;
      result[key] = {
        __type: 'DateRange',
        from: range.from?.toISOString(),
        to: range.to?.toISOString(),
      };
    } else {
      result[key] = val;
    }
  }
  return result;
}

export function deserializeParamValues(raw: Record<string, unknown>): QueryParamValues {
  const result: QueryParamValues = {};
  for (const [key, val] of Object.entries(raw)) {
    if (val && typeof val === 'object' && '__type' in val) {
      const typed = val as Record<string, unknown>;
      if (typed.__type === 'Date') {
        result[key] = new Date(typed.value as string);
      } else if (typed.__type === 'DateRange') {
        result[key] = {
          from: typed.from ? new Date(typed.from as string) : undefined,
          to: typed.to ? new Date(typed.to as string) : undefined,
        } as DateRange;
      }
    } else {
      result[key] = val as QueryParamValues[string];
    }
  }
  return result;
}

export function readPresetQueryPrefs(tableId: string): PresetQueryPrefs {
  const table = readTablePreferences(tableId);
  return table?.presetQueryPrefs ?? {};
}

export function writePresetQueryPrefs(tableId: string, prefs: PresetQueryPrefs): void {
  writeTablePreferences(tableId, { presetQueryPrefs: prefs });
}

export function readSavedUserQueries(tableId: string): SavedUserQuery[] {
  const table = readTablePreferences(tableId);
  if (!table?.savedUserQueries?.length) return [];
  return table.savedUserQueries.map((q) => ({
    ...q,
    params: deserializeParamValues(q.params),
  }));
}

export function writeSavedUserQueries(tableId: string, queries: SavedUserQuery[]): void {
  const serialized: StoredSavedUserQuery[] = queries.map((q) => ({
    ...q,
    params: serializeParamValues(q.params),
  }));
  writeTablePreferences(tableId, { savedUserQueries: serialized });
}

/** Deep-merges a single query run into the table's queryState without clobbering other keys. */
export function writeQueryRunPreferences(
  tableId: string,
  queryId: string,
  params: QueryParamValues
): void {
  const prefs = read();
  const table = prefs.tables[tableId] ?? {};
  const existing = table.queryState ?? {};
  prefs.tables[tableId] = {
    ...table,
    queryState: {
      ...existing,
      lastConfirmedQueryId: queryId,
      lastRunParams: {
        [queryId]: serializeParamValues(params),
      },
    },
  };
  write(prefs);
}
