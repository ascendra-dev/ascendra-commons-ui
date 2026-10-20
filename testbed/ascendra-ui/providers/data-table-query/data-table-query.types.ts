import type { DateRange } from 'react-day-picker';
import type { DateExpr } from './date-expr';

export type FieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'daterange'
  | 'checkbox'
  | 'radio'
  /** Columns to sort by, in priority order, each ascending or descending — a list of sort tokens
   *  (`'amount'`, `'issuedAt:desc'`) ready for the `orderBy` param via `toOrderBy`. Options are the columns. */
  | 'sort';

export interface SelectOption {
  value: string;
  label: string;
}

export interface ColumnsConfig {
  sm?: number;
  md?: number;
  lg?: number;
}

/** A field's starting value — and what Reset restores. Dates are DateExprs, resolved when the form opens. */
export type FieldDefaultValue = string | number | boolean | string[] | { from: DateExpr; to?: DateExpr };

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  /** Subtitle shown below the label in text-xs (above the input) */
  info?: string;
  /** Helper text shown below the input */
  description?: string;
  /** Shows a red "Mandatory" badge next to the description */
  mandatory?: boolean;
  /** Shows a gray "Optional" badge next to the description */
  optional?: boolean;
  span?: 1 | 2 | 'full';
  options?: SelectOption[];
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  /** text: a regex (source string) the whole value must match; an empty optional field skips it. */
  pattern?: string;
  /** text: message when `pattern` fails. Default "<label> is not in the expected format". */
  patternMessage?: string;
  /** multiselect / sort: most items that may be selected. */
  maxItems?: number;
  /** date / daterange: earliest allowed day, inclusive — e.g. 'today', '-1y', '2026-01-01'. */
  minDate?: DateExpr;
  /** date / daterange: latest allowed day, inclusive — e.g. 'today' for past-only. */
  maxDate?: DateExpr;
  /** daterange: longest allowed range in days, counting both ends (Oct 1–Oct 1 is 1 day). */
  maxRangeDays?: number;
  /** date / daterange: a pencil switches the field to a dd/mm/yyyy text box, so the date can be typed as well as picked. */
  editable?: boolean;
  /** Starting value — and what Reset restores. Ignored when the user has a saved draft for the query. */
  defaultValue?: FieldDefaultValue;
}

export interface SectionBreak {
  _type: 'section';
  title: string;
  /** When true, renders a floating pill label on the panel item border */
  showTitle?: boolean;
}

export type ParamItem = FieldDef | SectionBreak;

export function isFieldDef(item: ParamItem): item is FieldDef {
  return !('_type' in item);
}

export type QueryParamValues = Record<
  string,
  string | number | boolean | Date | DateRange | string[] | undefined
>;

/** `trigger` queries are never listed (dropdown or Manage Queries) — they run only via runQuery() or the URL. */
export type QueryGroup = 'query' | 'user-query' | 'filter' | 'trigger';

export interface QueryOptions {
  staleTime?: number;
  retry?: number | boolean;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

export interface QueryDef {
  id: string;
  title: string;
  description: string;
  group: QueryGroup;
  /** Rendered in CardFooter when present */
  info?: string;
  /** Grid column count per breakpoint — defaults to sm:1, md:1, lg:1 */
  columns?: ColumnsConfig;
  params?: ParamItem[];
  /** React Query cache/retry options for this query */
  queryOptions?: QueryOptions;
}

/** Response shape returned by every QueryFn */
export type QueryResult<T = unknown> = {
  data: T[];
  totalBatches: number;
  /** False when totalBatches is a lower-bound estimate (e.g. cursor-walked), not a known count. Defaults to true. */
  totalBatchesExact?: boolean;
};

/** A param value passed to runQuery() or read from the URL. Dates also take a DateExpr (`'-7d'`, `'today'`,
 *  `'2026-07-01'`) or an ISO timestamp; a URL value is always a string and is parsed by its field's type. */
export type TriggerParamValue =
  | string
  | number
  | boolean
  | string[]
  | Date
  | { from: Date | string; to?: Date | string };

export type TriggerParams = Record<string, TriggerParamValue | undefined>;

/** Function that fetches rows for a query, receiving confirmed param values and the requested batch */
export type QueryFn<T = unknown> = (
  params: QueryParamValues,
  batch: number,
) => Promise<QueryResult<T>>;

/** Map of queryId → fetch function, passed separately from QueryDef for serializability */
export type QueryFunctionMap<T = unknown> = Record<string, QueryFn<T>>;

/** Resolver function for dynamic options — receives current form values */
export type FieldOptionsResolver = (currentValues: QueryParamValues) => SelectOption[];

/** Static array or dynamic resolver for a field's options */
export type FieldOptionsDef = SelectOption[] | FieldOptionsResolver;

/** Map of queryId → fieldName → options, passed separately from QueryDef for serializability */
export type FieldOptionsMap = Record<string, Record<string, FieldOptionsDef>>;

export interface SavedUserQuery {
  id: string;
  name: string;
  description: string;
  sourceQueryId: string;
  params: QueryParamValues;
  enabled: boolean;
  order: number;
  createdAt: string;
}

export interface QueryContextValue {
  queries: QueryDef[];
  activeQuery: QueryDef;
  /** The query whose results are showing — may be a trigger or a query hidden in Manage Queries. */
  confirmedQuery: QueryDef;
  confirmedQueryId: string;
  pendingQueryId: string | null;
  setActiveQueryId: (id: string) => void;
  confirmPending: () => void;
  /** Closes a filter query's param panel and restores the run that was showing before it opened. */
  cancelPending: () => void;
  /** False when the panel has no earlier run to return to (e.g. a filter query is active on first load). */
  canCancelPending: boolean;
  /** True on the first render while localStorage preferences and the URL are being read. Use to suppress query-specific UI. */
  isInitializing: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  /** Absent while a trigger error is showing — re-running bad trigger params can't succeed. */
  refetch?: () => void;
  data: unknown[];
  /** The params the run fetches with — `runParams` minus any muted fields. Use this to export or re-fetch. */
  confirmedParams: QueryParamValues | null;
  setConfirmedParams: (values: QueryParamValues) => void;
  /** The run's params as confirmed, muted fields included — what the run's criteria show. */
  runParams: QueryParamValues | null;
  /** The preset query whose fields the run uses — the confirmed query itself, or a saved user query's source. */
  runSourceQuery: QueryDef;
  /** Fields left out of this run without changing its params. Cleared by the next run. */
  mutedParams: string[];
  /** Mutes or unmutes one of the run's fields and re-fetches from batch 1. Required fields can't be muted. */
  toggleParamMuted: (name: string) => void;
  /** Re-runs what's showing with one param changed, from batch 1 — mutes kept. A saved user query itself never
   *  changes; a filter's change is remembered as its last run (and shows when its form reopens). */
  setRunParam: (name: string, value: QueryParamValues[string]) => void;
  /** A link to this page that re-runs what's showing — the run's preset query (a saved user query's source filter)
   *  with its unmuted params, dates fixed. Null while there's no run to link to. */
  getRunLink: () => string | null;
  currentBatch: number;
  totalBatches: number | null;
  /** False when totalBatches is a lower-bound estimate, not a known count — see QueryResult.totalBatchesExact. */
  totalBatchesExact: boolean;
  /** Which button's batch is loading after a next/back step — the previous batch's rows stay showing meanwhile, and
   *  isLoading stays false. Null otherwise, including a cached batch (it shows at once). */
  batchLoading: 'next' | 'prev' | null;
  goNextBatch: () => void;
  goPrevBatch: () => void;
  fieldOptions: FieldOptionsMap;
  saveDraftValues: (queryId: string, values: QueryParamValues) => void;
  getDraftValues: (queryId: string) => QueryParamValues | null;
  savedUserQueries: SavedUserQuery[];
  saveAsUserQuery: (sourceQueryId: string, name: string, description: string, params: QueryParamValues) => void;
  removeUserQuery: (id: string) => void;
  updateUserQueries: (updated: SavedUserQuery[]) => void;
  /** All queries including disabled ones — used by the manage dialog. */
  allQueries: QueryDef[];
  /** IDs of all currently disabled queries (preset and user). */
  disabledQueryIds: string[];
  /** Toggle the enabled state of any query by ID. */
  toggleQueryEnabled: (id: string) => void;
  /** Reorder queries within a group by providing the new ordered list of IDs. */
  reorderQueriesInGroup: (group: QueryGroup, orderedIds: string[]) => void;
  /**
   * Runs a query, filter or trigger by id — including ones hidden in Manage Queries; saved user queries can't be
   * triggered. A query takes no params. A filter/trigger's missing params fall back to their defaultValue. An unknown
   * id, an unknown param, or a value that can't be parsed shows in the table's error state and nothing runs; a value
   * that fails a validation rule only logs a warning — the run goes ahead and the backend decides. Returns whether
   * it ran. The run is one-off: it isn't saved as the table's last run.
   */
  runQuery: (queryId: string, params?: TriggerParams) => boolean;
}

export interface DataTableQueryProviderProps<T = unknown> {
  queries: QueryDef[];
  queryFunctions: QueryFunctionMap<T>;
  fieldOptions?: FieldOptionsMap;
  /** Unique key used to persist last-run query params and last active query to localStorage.
   *  Omit to disable query state persistence. */
  tableId?: string;
  /** Prefix of the URL params that trigger a query on load: `?q=<queryId>&q.<field>=<value>`. Default `'q'`.
   *  Give each table on a page its own key. */
  urlKey?: string;
  children: React.ReactNode;
}
