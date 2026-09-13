'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
} from './data-table-query.types';

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

export function DataTableQueryProvider<T = unknown>({
  queries: propQueries,
  queryFunctions,
  fieldOptions = {},
  tableId,
  children,
}: DataTableQueryProviderProps<T>) {
  const [activeId, setActiveId] = useState(propQueries[0].id);
  const [pendingQueryId, setPendingQueryId] = useState<string | null>(null);
  const [confirmedParamsState, setConfirmedParamsState] = useState<QueryParamValues | null>(null);
  const [currentBatch, setCurrentBatch] = useState(1);
  const [isInitializing, setIsInitializing] = useState(!!tableId);

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

  // allQueries: every query including disabled ones — for the manage dialog
  const allQueries = useMemo<QueryDef[]>(() => {
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

  // mergedQueries: only enabled queries — shown in dropdown and used for active query lookup
  const mergedQueries = useMemo<QueryDef[]>(() => {
    const disabledSet = new Set(disabledPresetIds);
    const enabledPreset = orderedPresetQueries.filter((q) => !disabledSet.has(q.id));
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

  // Read localStorage after mount
  useEffect(() => {
    if (!tableId) return;

    const stored = readTablePreferences(tableId);

    const loadedUserQueries = readSavedUserQueries(tableId);
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

    setIsInitializing(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayId = pendingQueryId ?? activeId;
  const activeQuery = allQueries.find((q) => q.id === displayId) ?? allQueries[0];
  const confirmedQuery = allQueries.find((q) => q.id === activeId) ?? allQueries[0];

  const setActiveQueryId = useCallback((id: string) => {
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
      setPendingQueryId(id);
    } else if (presetQ) {
      setActiveId(id);
      setPendingQueryId(null);
      if (tableId) writeQueryRunPreferences(tableId, id, {});
    }
  }, [propQueries, tableId]);

  const confirmPending = useCallback(() => {
    if (pendingQueryId) {
      setActiveId(pendingQueryId);
      setPendingQueryId(null);
    }
  }, [pendingQueryId]);

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

  // Resolve query function — user queries delegate to their source filter's function
  const queryFn = (() => {
    if (confirmedQuery.group === 'user-query') {
      const savedQ = savedUserQueriesRef.current.find((q) => q.id === activeId);
      return savedQ ? queryFunctions[savedQ.sourceQueryId] : undefined;
    }
    return queryFunctions[activeId];
  })();

  const enabled = !isInitializing && (confirmedQuery.group !== 'filter' || confirmedParamsState !== null);

  const { data, isLoading, isError, error, refetch } = useQuery<QueryResult<T>, Error>({
    queryKey: ['data-table', activeId, confirmedParamsState, currentBatch],
    queryFn: () => queryFn!(confirmedParamsState ?? {}, currentBatch),
    enabled: !!queryFn && enabled,
    staleTime: confirmedQuery.queryOptions?.staleTime,
    retry: confirmedQuery.queryOptions?.retry,
    gcTime: confirmedQuery.queryOptions?.gcTime,
    refetchOnWindowFocus: confirmedQuery.queryOptions?.refetchOnWindowFocus,
  });

  const totalBatches = data?.totalBatches ?? null;

  const goNextBatch = useCallback(() => {
    setCurrentBatch((prev) =>
      totalBatches !== null ? Math.min(totalBatches, prev + 1) : prev + 1
    );
  }, [totalBatches]);

  const goPrevBatch = useCallback(() => {
    setCurrentBatch((prev) => Math.max(1, prev - 1));
  }, []);

  return (
    <QueryContext.Provider
      value={{
        queries: mergedQueries,
        activeQuery,
        confirmedQueryId: activeId,
        pendingQueryId,
        setActiveQueryId,
        confirmPending,
        isInitializing,
        isLoading: isInitializing || isLoading,
        isError,
        error: error ?? null,
        refetch,
        data: (data?.data ?? []) as unknown[],
        confirmedParams: confirmedParamsState,
        setConfirmedParams,
        currentBatch,
        totalBatches,
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
      }}
    >
      {children}
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
