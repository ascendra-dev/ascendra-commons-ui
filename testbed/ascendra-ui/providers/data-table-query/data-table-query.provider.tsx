'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { hashKey, useQuery } from '@tanstack/react-query';
import {
  readTablePreferences,
  writeQueryRunPreferences,
  deserializeParamValues,
  readSavedUserQueries,
  writeSavedUserQueries,
  readPresetQueryPrefs,
  writePresetQueryPrefs,
} from '@/ascendra-ui/preferences/preferences.storage';
import type {
  QueryContextValue,
  DataTableQueryProviderProps,
  QueryParamValues,
  QueryResult,
  SavedUserQuery,
  QueryDef,
  QueryGroup,
  QueryOptions,
  TriggerParams,
} from './data-table-query.types';
import { isFieldDef } from './data-table-query.types';
import { buildDefaultValues, buildZodSchema } from './query-params-schema';
import {
  buildQuerySearch,
  coerceTriggerParams,
  DEFAULT_QUERY_URL_KEY,
  QueryTriggerError,
  readQuerySearch,
  stripQuerySearch,
  toTriggerParams,
} from './query-trigger';

const QueryContext = createContext<QueryContextValue | null>(null);

/** Apply a stored ordering to a list of queries within their group. New items not in the order are appended. */
function applyGroupOrder(items: QueryDef[], order: string[]): QueryDef[] {
  if (!order.length) return items;
  const map = new Map(items.map((q) => [q.id, q]));
  const result: QueryDef[] = [];
  for (const id of order) {
    const item = map.get(id);
    if (item) result.push(item);
  }
  for (const item of items) {
    if (!result.includes(item)) result.push(item);
  }
  return result;
}

/** Groups whose queries need confirmed params before they run. */
function takesParams(group: QueryGroup) {
  return group === 'filter' || group === 'trigger';
}

// Dev-only: how many mounted tables use each urlKey — two tables sharing one would both read the same URL params.
const mountedUrlKeys = new Map<string, number>();

/** Triggers a query whenever the URL gains this table's params after load — e.g. a same-page <Link>. */
function QueryUrlListener({ urlKey, onTrigger }: { urlKey: string; onTrigger: (queryId: string, params: TriggerParams) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    // searchParams only signals a change — it can lag behind a strip we already did, so read the live URL.
    const trigger = readQuerySearch(new URLSearchParams(window.location.search), urlKey);
    if (!trigger) return;
    stripQuerySearch(urlKey);
    onTrigger(trigger.queryId, trigger.params);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, urlKey]);
  return null;
}

/** A QueryDef's `queryOptions` without its unset keys. */
function definedOptions(options: QueryOptions | undefined): QueryOptions {
  return Object.fromEntries(Object.entries(options ?? {}).filter(([, value]) => value !== undefined));
}

export function DataTableQueryProvider<T = unknown>({
  queries: propQueries,
  queryFunctions,
  fieldOptions = {},
  tableId,
  urlKey = DEFAULT_QUERY_URL_KEY,
  children,
}: DataTableQueryProviderProps<T>) {
  const [activeId, setActiveId] = useState(propQueries[0].id);
  const [pendingQueryId, setPendingQueryId] = useState<string | null>(null);
  const [confirmedParamsState, setConfirmedParamsRaw] = useState<QueryParamValues | null>(null);
  const [mutedParams, setMutedParams] = useState<string[]>([]);
  // `step` is set only by next/back — that's the one change that keeps the shown rows while the batch loads.
  const [batch, setBatch] = useState<{ number: number; step: 'next' | 'prev' | null }>({ number: 1, step: null });
  const currentBatch = batch.number;
  // Always starts true: the URL may name a query to run, and it has to be read before anything is fetched.
  const [isInitializing, setIsInitializing] = useState(true);
  // A trigger that couldn't run — shown in the error state instead of any results until another query is picked.
  const [triggerError, setTriggerError] = useState<QueryTriggerError | null>(null);
  // The run that was showing before a filter query's param panel opened — restored by cancelPending().
  const [runBeforePending, setRunBeforePending] = useState<
    { params: QueryParamValues | null; muted: string[]; batch: number } | null
  >(null);

  // Any batch change other than next/back — a new run, or a restored one — shows the loading state.
  function setCurrentBatch(number: number) {
    setBatch({ number, step: null });
  }

  // Every new run starts unmuted — mutes belong to the run they were made on.
  function setConfirmedParamsState(params: QueryParamValues | null, muted: string[] = []) {
    setConfirmedParamsRaw(params);
    setMutedParams(muted);
  }

  // Saved user queries
  const savedUserQueriesRef = useRef<SavedUserQuery[]>([]);
  const [savedUserQueries, setSavedUserQueriesRaw] = useState<SavedUserQuery[]>([]);

  // Preset query preferences — disabled IDs and custom group ordering
  const disabledPresetIdsRef = useRef<string[]>([]);
  const [disabledPresetIds, setDisabledPresetIdsRaw] = useState<string[]>([]);
  const presetGroupOrdersRef = useRef<Record<string, string[]>>({});
  const [presetGroupOrders, setPresetGroupOrdersRaw] = useState<Record<string, string[]>>({});

  function setSavedUserQueries(updated: SavedUserQuery[]) {
    savedUserQueriesRef.current = updated;
    setSavedUserQueriesRaw(updated);
  }
  function setDisabledPresetIds(updated: string[]) {
    disabledPresetIdsRef.current = updated;
    setDisabledPresetIdsRaw(updated);
  }
  function setPresetGroupOrders(updated: Record<string, string[]>) {
    presetGroupOrdersRef.current = updated;
    setPresetGroupOrdersRaw(updated);
  }

  const draftCacheRef = useRef<Record<string, QueryParamValues>>({});
  const confirmedParamsCacheRef = useRef<Record<string, QueryParamValues>>({});

  // All preset queries with custom group ordering applied (does not filter disabled)
  const orderedPresetQueries = useMemo<QueryDef[]>(() => {
    const groups = [...new Set(propQueries.map((q) => q.group))] as QueryGroup[];
    const result: QueryDef[] = [];
    for (const group of groups) {
      const groupItems = propQueries.filter((q) => q.group === group);
      result.push(...applyGroupOrder(groupItems, presetGroupOrders[group] ?? []));
    }
    return result;
  }, [propQueries, presetGroupOrders]);

  // Every query that can be showing, triggers included — for looking up the active query
  const lookupQueries = useMemo<QueryDef[]>(() => {
    const userQueryDefs: QueryDef[] = savedUserQueries
      .sort((a, b) => a.order - b.order)
      .map((q) => ({
        id: q.id,
        title: q.name,
        description: q.description,
        group: 'user-query' as const,
      }));
    return [...orderedPresetQueries, ...userQueryDefs];
  }, [orderedPresetQueries, savedUserQueries]);

  // allQueries: every listed query including disabled ones — for the manage dialog
  const allQueries = useMemo<QueryDef[]>(
    () => lookupQueries.filter((q) => q.group !== 'trigger'),
    [lookupQueries],
  );

  // mergedQueries: only enabled queries — shown in dropdown and used for active query lookup
  const mergedQueries = useMemo<QueryDef[]>(() => {
    const disabledSet = new Set(disabledPresetIds);
    const enabledPreset = orderedPresetQueries.filter((q) => q.group !== 'trigger' && !disabledSet.has(q.id));
    const enabledUserDefs: QueryDef[] = savedUserQueries
      .filter((q) => q.enabled)
      .sort((a, b) => a.order - b.order)
      .map((q) => ({
        id: q.id,
        title: q.name,
        description: q.description,
        group: 'user-query' as const,
      }));
    return [...enabledPreset, ...enabledUserDefs];
  }, [orderedPresetQueries, savedUserQueries, disabledPresetIds]);

  // disabledQueryIds: union of disabled preset IDs and disabled user query IDs
  const disabledQueryIds = useMemo<string[]>(() => [
    ...disabledPresetIds,
    ...savedUserQueries.filter((q) => !q.enabled).map((q) => q.id),
  ], [disabledPresetIds, savedUserQueries]);

  // Runs a query from code or the URL — see QueryContextValue.runQuery. Looks in the props, not the listed queries,
  // so triggers and queries hidden in Manage Queries run too, and saved user queries don't.
  const runQuery = useCallback((queryId: string, params: TriggerParams = {}): boolean => {
    const query = propQueries.find((q) => q.id === queryId);
    try {
      if (!query) throw new QueryTriggerError(`There's no query "${queryId}" on this table.`);
      const values = coerceTriggerParams(query, params);

      let confirmed: QueryParamValues | null = null;
      if (takesParams(query.group)) {
        const fields = (query.params ?? []).filter(isFieldDef);
        const merged = { ...buildDefaultValues(fields), ...values } as QueryParamValues;
        const result = buildZodSchema(fields).safeParse(merged);
        if (!result.success) {
          console.warn(
            `runQuery("${queryId}"): params fail validation — running anyway.`,
            result.error.issues.map((issue) => issue.message),
          );
        }
        confirmed = result.success ? (result.data as QueryParamValues) : merged;
        // Reopening a filter's form shows what was triggered — in memory only, the run is one-off.
        confirmedParamsCacheRef.current[query.id] = confirmed;
      }

      setTriggerError(null);
      setActiveId(query.id);
      setPendingQueryId(null);
      setConfirmedParamsState(confirmed);
      setCurrentBatch(1);
      return true;
    } catch (err) {
      if (!(err instanceof QueryTriggerError)) throw err;
      setTriggerError(err);
      return false;
    }
  }, [propQueries]);

  // Dev-only: warn when two mounted tables share a urlKey.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const count = (mountedUrlKeys.get(urlKey) ?? 0) + 1;
    mountedUrlKeys.set(urlKey, count);
    if (count > 1) {
      console.error(
        `DataTableQueryProvider: ${count} tables on this page use urlKey "${urlKey}" — give each its own urlKey so they don't read each other's URL params.`,
      );
    }
    return () => {
      mountedUrlKeys.set(urlKey, (mountedUrlKeys.get(urlKey) ?? 1) - 1);
    };
  }, [urlKey]);

  // Read localStorage and the URL after mount
  useEffect(() => {
    if (tableId) {
      const stored = readTablePreferences(tableId);

      const loadedUserQueries = readSavedUserQueries(tableId);
      // One-time hydration from localStorage after mount — starting from empty
      // defaults and flipping isInitializing once done avoids an SSR/hydration
      // mismatch, which a lazy useState initializer reading localStorage would
      // cause instead (localStorage isn't available during server render).
      setSavedUserQueries(loadedUserQueries);

      const presetPrefs = readPresetQueryPrefs(tableId);
      setDisabledPresetIds(presetPrefs.disabledIds ?? []);
      setPresetGroupOrders(presetPrefs.groupOrder ?? {});

      const lastId = stored?.queryState?.lastConfirmedQueryId;
      const userQueryIds = new Set(loadedUserQueries.map((q) => q.id));
      const presetIds = new Set(propQueries.map((q) => q.id));
      const allIds = new Set([...presetIds, ...userQueryIds]);

      if (lastId && allIds.has(lastId)) {
        if (userQueryIds.has(lastId)) {
          const savedQ = loadedUserQueries.find((q) => q.id === lastId);
          if (savedQ) setConfirmedParamsState(savedQ.params);
        } else {
          const lastQuery = propQueries.find((q) => q.id === lastId);
          if (lastQuery?.group === 'filter') {
            const raw = stored?.queryState?.lastRunParams?.[lastId];
            if (raw) setConfirmedParamsState(deserializeParamValues(raw));
          }
        }
        setActiveId(lastId);
      }
    }

    // A URL trigger wins over the last run restored above. Applying it in this same pass — before
    // isInitializing flips — means nothing else is fetched first.
    const trigger = readQuerySearch(new URLSearchParams(window.location.search), urlKey);
    if (trigger) {
      stripQuerySearch(urlKey);
      runQuery(trigger.queryId, trigger.params);
    }

    setIsInitializing(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayId = pendingQueryId ?? activeId;
  const activeQuery = lookupQueries.find((q) => q.id === displayId) ?? lookupQueries[0];
  const confirmedQuery = lookupQueries.find((q) => q.id === activeId) ?? lookupQueries[0];

  const setActiveQueryId = useCallback((id: string) => {
    // Triggers run only through runQuery.
    if (propQueries.find((q) => q.id === id)?.group === 'trigger') return;
    setTriggerError(null);
    const previousRun = { params: confirmedParamsState, muted: mutedParams, batch: currentBatch };
    const panelWasOpen = !!confirmedQuery.params?.length && confirmedParamsState === null;
    setCurrentBatch(1);
    setConfirmedParamsState(null);

    // User query (enabled or disabled — run regardless)
    const savedQ = savedUserQueriesRef.current.find((q) => q.id === id);
    if (savedQ) {
      const params = savedQ.params ?? {};
      setConfirmedParamsState(params);
      setActiveId(id);
      setPendingQueryId(null);
      if (tableId) writeQueryRunPreferences(tableId, id, params);
      return;
    }

    // Preset query
    const presetQ = propQueries.find((q) => q.id === id);
    if (presetQ?.group === 'filter') {
      // Snapshot only when a pending session starts from a real run — switching between filter
      // queries while the panel is already open keeps the original snapshot.
      if (pendingQueryId === null) setRunBeforePending(panelWasOpen ? null : previousRun);
      setPendingQueryId(id);
    } else if (presetQ) {
      setActiveId(id);
      setPendingQueryId(null);
      if (tableId) writeQueryRunPreferences(tableId, id, {});
    }
  }, [propQueries, tableId, confirmedParamsState, mutedParams, currentBatch, confirmedQuery, pendingQueryId]);

  const confirmPending = useCallback(() => {
    if (pendingQueryId) {
      setActiveId(pendingQueryId);
      setPendingQueryId(null);
    }
  }, [pendingQueryId]);

  const canCancelPending = pendingQueryId !== null && runBeforePending !== null;

  const cancelPending = useCallback(() => {
    if (pendingQueryId === null || runBeforePending === null) return;
    setConfirmedParamsState(runBeforePending.params, runBeforePending.muted);
    setCurrentBatch(runBeforePending.batch);
    setPendingQueryId(null);
  }, [pendingQueryId, runBeforePending]);

  const setConfirmedParams = useCallback((values: QueryParamValues) => {
    const confirmedId = pendingQueryId ?? activeId;
    setConfirmedParamsState(values);
    setCurrentBatch(1);
    confirmedParamsCacheRef.current[confirmedId] = values;
    if (tableId) writeQueryRunPreferences(tableId, confirmedId, values);
  }, [tableId, activeId, pendingQueryId]);

  const saveDraftValues = useCallback((queryId: string, values: QueryParamValues) => {
    draftCacheRef.current[queryId] = values;
  }, []);

  const getDraftValues = useCallback((queryId: string): QueryParamValues | null => {
    const draft = draftCacheRef.current[queryId];
    if (draft) return draft;
    const confirmed = confirmedParamsCacheRef.current[queryId];
    if (confirmed) return confirmed;
    if (!tableId) return null;
    const stored = readTablePreferences(tableId);
    const raw = stored?.queryState?.lastRunParams?.[queryId];
    return raw ? deserializeParamValues(raw) : null;
  }, [tableId]);

  const saveAsUserQuery = useCallback((
    sourceQueryId: string,
    name: string,
    description: string,
    params: QueryParamValues,
  ) => {
    const newQuery: SavedUserQuery = {
      id: `user-query-${Date.now()}`,
      name,
      description,
      sourceQueryId,
      params,
      enabled: true,
      order: savedUserQueriesRef.current.length,
      createdAt: new Date().toISOString(),
    };
    const updated = [...savedUserQueriesRef.current, newQuery];
    setSavedUserQueries(updated);
    if (tableId) writeSavedUserQueries(tableId, updated);
  }, [tableId]);

  const removeUserQuery = useCallback((id: string) => {
    const filtered = savedUserQueriesRef.current.filter((q) => q.id !== id);
    const reordered = filtered.map((q, i) => ({ ...q, order: i }));
    setSavedUserQueries(reordered);
    if (tableId) writeSavedUserQueries(tableId, reordered);
    if (activeId === id) {
      setActiveId(propQueries[0].id);
      setConfirmedParamsState(null);
    }
  }, [tableId, activeId, propQueries]);

  const updateUserQueries = useCallback((updated: SavedUserQuery[]) => {
    setSavedUserQueries(updated);
    if (tableId) writeSavedUserQueries(tableId, updated);
    const activeUserQuery = updated.find((q) => q.id === activeId);
    if (activeUserQuery && !activeUserQuery.enabled) {
      setActiveId(propQueries[0].id);
      setConfirmedParamsState(null);
      setPendingQueryId(null);
    }
  }, [tableId, activeId, propQueries]);

  const toggleQueryEnabled = useCallback((id: string) => {
    // User query toggle
    const userQuery = savedUserQueriesRef.current.find((q) => q.id === id);
    if (userQuery) {
      const updated = savedUserQueriesRef.current.map((q) =>
        q.id === id ? { ...q, enabled: !q.enabled } : q
      );
      setSavedUserQueries(updated);
      if (tableId) writeSavedUserQueries(tableId, updated);
      // Fall back if the now-disabled query was active
      if (userQuery.enabled && activeId === id) {
        setActiveId(propQueries[0].id);
        setConfirmedParamsState(null);
        setPendingQueryId(null);
      }
      return;
    }

    // Preset query toggle
    const isDisabled = disabledPresetIdsRef.current.includes(id);
    const updated = isDisabled
      ? disabledPresetIdsRef.current.filter((d) => d !== id)
      : [...disabledPresetIdsRef.current, id];
    setDisabledPresetIds(updated);
    if (tableId) writePresetQueryPrefs(tableId, { disabledIds: updated, groupOrder: presetGroupOrdersRef.current });
    // Fall back if the now-disabled query was active
    if (!isDisabled && (activeId === id || pendingQueryId === id)) {
      const firstEnabled = propQueries.find((q) => !updated.includes(q.id));
      setActiveId(firstEnabled?.id ?? propQueries[0].id);
      setConfirmedParamsState(null);
      setPendingQueryId(null);
    }
  }, [tableId, activeId, pendingQueryId, propQueries]);

  const reorderQueriesInGroup = useCallback((group: QueryGroup, orderedIds: string[]) => {
    if (group === 'user-query') {
      const updated = orderedIds
        .map((id, i) => {
          const q = savedUserQueriesRef.current.find((q) => q.id === id);
          return q ? { ...q, order: i } : null;
        })
        .filter(Boolean) as SavedUserQuery[];
      // Append any user queries that weren't in the orderedIds list
      const inSet = new Set(orderedIds);
      for (const q of savedUserQueriesRef.current) {
        if (!inSet.has(q.id)) updated.push({ ...q, order: updated.length });
      }
      setSavedUserQueries(updated);
      if (tableId) writeSavedUserQueries(tableId, updated);
    } else {
      const updated = { ...presetGroupOrdersRef.current, [group]: orderedIds };
      setPresetGroupOrders(updated);
      if (tableId) writePresetQueryPrefs(tableId, { disabledIds: disabledPresetIdsRef.current, groupOrder: updated });
    }
  }, [tableId]);

  // The preset behind the run — a saved user query runs its source filter's function with that filter's fields.
  const runSourceQuery = (() => {
    if (confirmedQuery.group !== 'user-query') return confirmedQuery;
    const sourceId = savedUserQueries.find((q) => q.id === activeId)?.sourceQueryId;
    return propQueries.find((q) => q.id === sourceId) ?? confirmedQuery;
  })();
  const queryFn = confirmedQuery.group === 'user-query' && runSourceQuery === confirmedQuery
    ? undefined
    : queryFunctions[runSourceQuery.id];

  // What the run fetches with: its params minus the muted fields.
  const effectiveParams = useMemo<QueryParamValues | null>(() => {
    if (!confirmedParamsState || !mutedParams.length) return confirmedParamsState;
    const params = { ...confirmedParamsState };
    for (const name of mutedParams) delete params[name];
    return params;
  }, [confirmedParamsState, mutedParams]);

  const toggleParamMuted = useCallback((name: string) => {
    const field = (runSourceQuery.params ?? []).filter(isFieldDef).find((f) => f.name === name);
    if (!field || field.required) return;
    setMutedParams((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
    setCurrentBatch(1);
  }, [runSourceQuery]);

  const setRunParam = useCallback((name: string, value: QueryParamValues[string]) => {
    if (!confirmedParamsState) return;
    const params = { ...confirmedParamsState, [name]: value };
    setConfirmedParamsRaw(params); // not setConfirmedParamsState — the run's mutes stay
    setCurrentBatch(1);
    if (!takesParams(confirmedQuery.group)) return;
    confirmedParamsCacheRef.current[activeId] = params;
    const draft = draftCacheRef.current[activeId];
    if (draft) draftCacheRef.current[activeId] = { ...draft, [name]: value };
    // A trigger run is one-off — only a filter's run is saved as the table's last run.
    if (tableId && confirmedQuery.group === 'filter') writeQueryRunPreferences(tableId, activeId, params);
  }, [confirmedParamsState, confirmedQuery, activeId, tableId]);

  const getRunLink = useCallback((): string | null => {
    if (isInitializing || triggerError || pendingQueryId !== null) return null;
    if (takesParams(runSourceQuery.group) && !effectiveParams) return null;
    // Keeps the page's other params — only this table's are replaced.
    const url = new URL(window.location.href);
    for (const key of [...new Set(url.searchParams.keys())]) {
      if (key === urlKey || key.startsWith(`${urlKey}.`)) url.searchParams.delete(key);
    }
    const run = new URLSearchParams(buildQuerySearch(runSourceQuery.id, toTriggerParams(effectiveParams ?? {}), urlKey));
    for (const [key, value] of run) url.searchParams.append(key, value);
    return url.toString();
  }, [isInitializing, triggerError, pendingQueryId, runSourceQuery, effectiveParams, urlKey]);

  const enabled =
    !isInitializing && !triggerError && (!takesParams(confirmedQuery.group) || confirmedParamsState !== null);

  const runKey = ['data-table', activeId, effectiveParams];
  const { data: queryData, isLoading, isError, error, refetch, isPlaceholderData } = useQuery<QueryResult<T>, Error>({
    queryKey: [...runKey, currentBatch],
    queryFn: () => queryFn!(effectiveParams ?? {}, currentBatch),
    // A next/back step keeps the previous batch showing until the new one arrives — only within the same run.
    placeholderData: (previous, previousQuery) =>
      batch.step && previousQuery && hashKey(previousQuery.queryKey.slice(0, -1)) === hashKey(runKey) ? previous : undefined,
    enabled: !!queryFn && enabled,
    // Only the options this query sets: an explicit `undefined` would override QueryProvider's defaults (a
    // `retry: undefined` meant React Query's own 3 retries, even for a 403).
    ...definedOptions(confirmedQuery.queryOptions),
  });

  // A trigger error hides whatever is cached for the query still selected.
  const data = triggerError ? undefined : queryData;
  const totalBatches = data?.totalBatches ?? null;
  const totalBatchesExact = data?.totalBatchesExact ?? true;
  const batchLoading = isPlaceholderData ? batch.step : null;

  const goNextBatch = useCallback(() => {
    // No-op while the bound isn't known yet (the run's first load) or a step is in flight —
    // TableFoot also disables the buttons then, this is a backstop for any other caller.
    if (totalBatches === null || batchLoading) return;
    setBatch((prev) => (prev.number >= totalBatches ? prev : { number: prev.number + 1, step: 'next' }));
  }, [totalBatches, batchLoading]);

  const goPrevBatch = useCallback(() => {
    if (batchLoading) return;
    setBatch((prev) => (prev.number <= 1 ? prev : { number: prev.number - 1, step: 'prev' }));
  }, [batchLoading]);

  return (
    <QueryContext.Provider
      value={{
        queries: mergedQueries,
        activeQuery,
        confirmedQuery,
        confirmedQueryId: activeId,
        pendingQueryId,
        setActiveQueryId,
        confirmPending,
        cancelPending,
        canCancelPending,
        isInitializing,
        isLoading: isInitializing || isLoading,
        isError: !!triggerError || isError,
        error: triggerError ?? error ?? null,
        refetch: triggerError ? undefined : refetch,
        data: (data?.data ?? []) as unknown[],
        confirmedParams: effectiveParams,
        setConfirmedParams,
        runParams: confirmedParamsState,
        runSourceQuery,
        mutedParams,
        toggleParamMuted,
        setRunParam,
        getRunLink,
        currentBatch,
        totalBatches,
        totalBatchesExact,
        batchLoading,
        goNextBatch,
        goPrevBatch,
        fieldOptions,
        saveDraftValues,
        getDraftValues,
        savedUserQueries,
        saveAsUserQuery,
        removeUserQuery,
        updateUserQueries,
        allQueries,
        disabledQueryIds,
        toggleQueryEnabled,
        reorderQueriesInGroup,
        runQuery,
      }}
    >
      {children}
      {/* Mounted after the first URL read, so it only sees later changes. Never renders on the server. */}
      {!isInitializing && (
        <Suspense fallback={null}>
          <QueryUrlListener urlKey={urlKey} onTrigger={runQuery} />
        </Suspense>
      )}
    </QueryContext.Provider>
  );
}

export function useQueryContext(): QueryContextValue {
  const ctx = useContext(QueryContext);
  if (!ctx) throw new Error('useQueryContext must be used within DataTableQueryProvider');
  return ctx;
}

export function useOptionalQueryContext(): QueryContextValue | null {
  return useContext(QueryContext);
}

/** True while the active query's param form is showing (it has params, none confirmed yet) — the table chrome hides meanwhile. */
export function useIsQueryParamPanelOpen(): boolean {
  const ctx = useOptionalQueryContext();
  return !!ctx && ctx.activeQuery.group !== 'trigger' && !!ctx.activeQuery.params?.length && ctx.confirmedParams === null;
}
