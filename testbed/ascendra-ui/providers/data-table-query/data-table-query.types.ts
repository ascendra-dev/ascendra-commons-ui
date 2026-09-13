import type { DateRange } from 'react-day-picker';

export type FieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'daterange'
  | 'checkbox'
  | 'radio';

export interface SelectOption {
  value: string;
  label: string;
}

export interface ColumnsConfig {
  sm?: number;
  md?: number;
  lg?: number;
}

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

export type QueryGroup = 'query' | 'user-query' | 'filter';

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
};

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
  confirmedQueryId: string;
  pendingQueryId: string | null;
  setActiveQueryId: (id: string) => void;
  confirmPending: () => void;
  /** True on the first render while localStorage preferences are being read. Use to suppress query-specific UI. */
  isInitializing: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  data: unknown[];
  confirmedParams: QueryParamValues | null;
  setConfirmedParams: (values: QueryParamValues) => void;
  currentBatch: number;
  totalBatches: number | null;
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
}

export interface DataTableQueryProviderProps<T = unknown> {
  queries: QueryDef[];
  queryFunctions: QueryFunctionMap<T>;
  fieldOptions?: FieldOptionsMap;
  /** Unique key used to persist last-run query params and last active query to localStorage.
   *  Omit to disable query state persistence. */
  tableId?: string;
  children: React.ReactNode;
}
